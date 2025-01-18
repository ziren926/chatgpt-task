// src/components/Content/index.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import "./index.css";
import NavBar from "../NavBar";
import CardV2 from "../CardV2";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import TagSelector from "../TagSelector";
import GithubLink from "../GithubLink";
import DarkSwitch from "../DarkSwitch";
import { FetchList } from "../../utils/api";
import pinyin from "pinyin-match";
import { generateSearchEngineCard } from "../../utils/serachEngine";
import { toggleJumpTarget } from "../../utils/setting";
import { ApiResponse, Tool } from "../../types/api";

// Types
interface ContentProps {
  // Add props interface if needed
}

// Helper functions
const mutiSearch = (source: string, target: string): boolean => {
  const normalizedSource = source.toLowerCase();
  const normalizedTarget = target.toLowerCase();

  return (
    normalizedSource.includes(normalizedTarget) ||
    Boolean(pinyin.match(normalizedSource, normalizedTarget))
  );
};

const Content: React.FC<ContentProps> = () => {
  // State
  const [data, setData] = useState<ApiResponse>({
    tools: [],
    catelogs: ["全部工具"]
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [currTag, setCurrTag] = useState("全部工具");
  const [searchString, setSearchString] = useState("");
  const [val, setVal] = useState("");

  // Refs
  const filteredDataRef = useRef<Tool[]>([]);

  // Memoized values
  const showGithub = useMemo(() => {
    return !data?.setting?.hideGithub;
  }, [data]);

  // Event handlers
  const handleSetCurrTag = (tag: string) => {
    setCurrTag(tag);
    if (tag !== "管理后台") {
      window.localStorage.setItem("tag", tag);
    }
    resetSearch(true);
  };

  const handleSetSearch = (val: string) => {
    if (val.trim()) {
      setCurrTag("全部工具");
      setSearchString(val.trim());
    } else {
      resetSearch();
    }
  };

  const onKeyEnter = (ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;

    // Enter key
    if (ev.keyCode === 13 && cards?.length) {
      window.open(cards[0]?.url, "_blank");
      resetSearch();
    }

    // Ctrl/Meta + Number
    if ((ev.ctrlKey || ev.metaKey)) {
      const num = Number(ev.key);
      if (!isNaN(num)) {
        ev.preventDefault();
        const index = num - 1;
        if (index >= 0 && index < cards.length) {
          window.open(cards[index]?.url, "_blank");
          resetSearch();
        }
      }
    }
  };

  // Helper functions
  const resetSearch = (notSetTag?: boolean) => {
    setVal("");
    setSearchString("");
    const tagInLocalStorage = window.localStorage.getItem("tag");

    if (!notSetTag &&
        tagInLocalStorage &&
        tagInLocalStorage !== "" &&
        tagInLocalStorage !== "管理后台") {
      setCurrTag(tagInLocalStorage);
    }
  };

  // Data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await FetchList();
      setData(response);

      const tagInLocalStorage = window.localStorage.getItem("tag");
      if (tagInLocalStorage &&
          response?.catelogs?.includes(tagInLocalStorage)) {
        setCurrTag(tagInLocalStorage);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!data.tools) {
      const searchResults = generateSearchEngineCard(searchString);
      return searchResults.map(item => ({
        ...item,
        catelog: '搜索'
      }));
    }

    const localResult = data.tools
      .filter((item: Tool) =>
        currTag === "全部工具" || item.catelog === currTag
      )
      .filter((item: Tool) => {
        if (!searchString) return true;

        return (
          mutiSearch(item.name, searchString) ||
          mutiSearch(item.desc, searchString) ||
          mutiSearch(item.url, searchString)
        );
      });

    const searchResults = generateSearchEngineCard(searchString).map(item => ({
      ...item,
      catelog: '搜索'
    }));

    return [...localResult, ...searchResults];
  }, [data, currTag, searchString]);

  // Card rendering
  const renderCards = useCallback(() => {
    return filteredData.map((item: Tool, index: number) => (
      <CardV2
        key={item.id}
        id={item.id}
        title={item.name}
        url={item.url}
        des={item.desc}
        logo={item.logo}
        catelog={item.catelog}
        index={index}
        isSearching={searchString.trim() !== ""}
        onClick={() => {
          resetSearch();
          if (item.url === "toggleJumpTarget") {
            toggleJumpTarget();
            loadData();
          }
        }}
      />
    ));
  }, [filteredData, searchString, loadData]);

  // Effects
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);

  useEffect(() => {
    const shouldAddListener = searchString.trim() !== "";

    if (shouldAddListener) {
      document.addEventListener("keydown", onKeyEnter);
    } else {
      document.removeEventListener("keydown", onKeyEnter);
    }

    return () => {
      document.removeEventListener("keydown", onKeyEnter);
    };
  }, [searchString]);

  const navItems = [
    {
      title: "工具",
      url: "/",
    },
    {
      title: "文档",
      url: "/docs",
    },
    {
      title: "GitHub",
      url: "https://github.com/ziren926/chatgpt-task",
    }
  ];

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <link rel="icon" href={data?.setting?.favicon ?? "favicon.ico"} />
        <title>{data?.setting?.title ?? "Van Nav"}</title>
      </Helmet>
      <NavBar items={navItems} activeIndex={0} />
      <div className="topbar">
        <div className="content">
          <SearchBar
            searchString={val}
            setSearchText={(text) => {
              setVal(text);
              handleSetSearch(text);
            }}
          />
          <TagSelector
            tags={data?.catelogs ?? ["全部工具"]}
            currTag={currTag}
            onTagChange={handleSetCurrTag}
          />
        </div>
      </div>

      <div className="content-wraper">
        <div className="content cards">
          {loading ? <Loading /> : renderCards()}
        </div>
      </div>

      <div className="record-wraper">
        <a
          href="https://beian.miit.gov.cn"
          target="_blank"
          rel="noreferrer"
        >
          {data?.setting?.govRecord ?? ""}
        </a>
      </div>

      {showGithub && <GithubLink />}
      <DarkSwitch showGithub={showGithub} />
    </>
  );
};

export default Content;