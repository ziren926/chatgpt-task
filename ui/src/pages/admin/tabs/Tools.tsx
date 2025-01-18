// src/pages/admin/tabs/Tools.tsx
import {
  Button,
  Card,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Tooltip,
  Switch
} from "antd";
import { QuestionCircleOutlined, HolderOutlined } from '@ant-design/icons';
import React, { useCallback, useState, useEffect, useContext, useMemo } from "react";
import { getFilter, getOptions, mutiSearch } from "../../../utils/admin";
import {
  fetchAddTool,
  fetchDeleteTool,
  fetchExportTools,
  fetchImportTools,
  fetchUpdateTool,
  fetchUpdateToolsSort,
} from "../../../utils/api";
import { Tool } from '../../../types/api';
import { useData } from "../hooks/useData";
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 类型定义
interface ToolData extends Tool {
  sort: number;
}

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': React.Key;
}

// Context
const RowContext = React.createContext<RowContextProps>({});

// 拖动句柄组件
const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: 'move', touchAction: 'none' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

// 可拖动的行组件
const Row = ({ children, ...props }: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key']?.toString() || '',
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes}>
        {children}
      </tr>
    </RowContext.Provider>
  );
};

// 主组件
export const Tools: React.FC = () => {
  // State
  const { store, loading, reload } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [addForm] = Form.useForm();
  const [searchString, setSearchString] = useState("");
  const [catelogName, setCatelogName] = useState("");
  const [updateForm] = Form.useForm();
  const [selectedRows, setSelectRows] = useState<ToolData[]>([]);
  const [dataSource, setDataSource] = useState<ToolData[]>([]);

  // Handlers
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetchDeleteTool(id);
        message.success("删除成功!");
        reload();
      } catch (err) {
        message.warning("删除失败!");
      }
    },
    [reload]
  );

  const handleUpdate = useCallback(
    async (id: string, record: Partial<Tool>) => {
      setRequestLoading(true);
      try {
        await fetchUpdateTool(id, record);
        message.success("更新成功! Logo 将在 3 秒后刷新并加载！", 3);
        setTimeout(reload, 3000);
      } catch (err) {
        message.warning("更新失败!");
      } finally {
        setRequestLoading(false);
        setShowEdit(false);
      }
    },
    [reload]
  );

  const handleCreate = useCallback(
    async (record: Omit<Tool, 'id'>) => {
      setRequestLoading(true);
      try {
        await fetchAddTool(record);
        message.success("添加成功! Logo 将在 3 秒后刷新并加载！", 3);
        setTimeout(reload, 3000);
      } catch (err) {
        message.warning("添加失败!");
      } finally {
        setRequestLoading(false);
        setShowAddModel(false);
      }
    },
    [reload]
  );

  const handleImport = useCallback(
    async (data: Tool[]) => {
      try {
        await fetchImportTools(data);
        message.success("导入成功!");
        reload();
      } catch (err) {
        message.warning("导入失败!");
      }
    },
    [reload]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      await Promise.all(
        selectedRows.map(row => fetchDeleteTool(row.id))
      );
      message.success("删除成功!");
      reload();
    } catch (err) {
      message.error("删除失败!");
    }
  }, [selectedRows, reload]);

  const handleBulkResetLogo = useCallback(async () => {
    try {
      await Promise.all(
        selectedRows.map(row =>
          fetchUpdateTool(row.id, { ...row, logo: "" })
        )
      );
      message.success("重置成功!");
      reload();
    } catch (err) {
      message.error("重置失败!");
    }
  }, [selectedRows, reload]);

  const handleBulkCacheLogo = useCallback(async () => {
    try {
      await Promise.all(
        selectedRows.map(row =>
          fetchUpdateTool(row.id, row)
        )
      );
      message.success("重置成功!");
      reload();
    } catch (err) {
      message.error("重置失败!");
    }
  }, [selectedRows, reload]);

  const handleExport = useCallback(async () => {
    try {
      const data = await fetchExportTools();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tools.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("导出成功！");
    } catch (err) {
      message.error("导出失败！");
    }
  }, []);

  // Drag and Drop handler
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataSource((previous) => {
        const activeIndex = previous.findIndex((i) => i.id === active.id);
        const overIndex = previous.findIndex((i) => i.id === over?.id);

        const newData = arrayMove(previous, activeIndex, overIndex);
        const updates = newData.map((item, index) => ({
          id: item.id,
          sort: index + 1,
        }));

        fetchUpdateToolsSort(updates).then(() => {
          message.success('排序更新成功');
          reload();
        }).catch(() => {
          message.error('排序更新失败');
        });

        return newData;
      });
    }
  };

  // Effects
  useEffect(() => {
    if (store?.tools) {
      const filteredData = store.tools
        .filter((item: Tool) => {
          const nameMatch = searchString === "" ||
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString);

          const catelogMatch = !catelogName ||
            mutiSearch(item.catelog, catelogName);

          return nameMatch && catelogMatch;
        })
        .map(item => ({
          ...item,
          sort: item.sort || 0
        }))
        .sort((a, b) => a.sort - b.sort);

      setDataSource(filteredData);
    }
  }, [store?.tools, searchString, catelogName]);

  // Columns configuration
  const columns = [
    {
      key: "sort",
      title: "排序",
      align: "center" as const,
      width: 50,
      render: () => <DragHandle />
    },
    {
      title: "ID",
      dataIndex: "id",
      width: 40
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 120,
      render: (_: any, record: ToolData) => (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center"
        }}>
          <img
            src={`/api/img?url=${record.logo}`}
            width={32}
            height={32}
            alt={`${record.name} 的图标`}
          />
          <span style={{ marginLeft: 8 }}>{record.name}</span>
        </div>
      )
    },
    {
      title: "分类",
      dataIndex: "catelog",
      width: 60,
      filters: getFilter(store?.catelogs || []),
      onFilter: (value: string, record: ToolData) => record.catelog === value
    },
    {
      title: "网址",
      dataIndex: "url",
      width: 150,
      render: (url: string) => (
        <div style={{
          wordBreak: 'break-all',
          whiteSpace: 'normal'
        }}>
          {url}
        </div>
      )
    },
    {
      title: (
        <span>隐藏
          <Tooltip title="开启后只有登录后才会展示该工具">
            <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "hide",
      width: 50,
      render: (val: boolean) => val ? "是" : "否"
    },
    {
      title: "操作",
      width: 40,
      key: "action",
      render: (_: any, record: ToolData) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              updateForm.setFieldsValue(record);
              setShowEdit(true);
            }}
          >
            修改
          </Button>
          <Popconfirm
            title={`确定要删除 ${record.name} 吗？`}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={
        <Space>
          <span>{`当前共 ${store?.tools?.length ?? 0} 条`}</span>
          {selectedRows.length > 0 && (
            <Popconfirm
              title="确定删除这些吗？"
              onConfirm={() => {
                handleBulkDelete();
              }}
            >
              <Button type="link">删除</Button>
            </Popconfirm>
          )}
          {selectedRows.length > 0 && (
            <Popconfirm
              title="确定重置这些的图标吗？（会自动获取网站默认的）"
              onConfirm={() => {
                handleBulkResetLogo();
              }}
            >
              <Button type="link">重置默认图标</Button>
            </Popconfirm>
          )}
          {selectedRows.length > 0 && (
            <Popconfirm
              title="确定重新缓存这些的图标吗？（会自动获取图标缓存到数据库）"
              onConfirm={() => {
                handleBulkCacheLogo();
              }}
            >
              <Button type="link">重置缓存图标</Button>
            </Popconfirm>
          )}
        </Space>
      }
      extra={
        <Space>
          <Select
            options={getOptions(store?.catelogs || [])}
            placeholder="分类筛选"
            allowClear
            // size="small"
            onClear={() => {
              setCatelogName("");
            }}
            onChange={(name: string) => {
              setCatelogName(name);
            }}
          />
          <Input.Search
            allowClear
            onSearch={(s: string) => {
              setSearchString(s.trim());
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              setShowAddModel(true);
            }}
          >
            添加
          </Button>
          <Button
            type="primary"
            onClick={() => {
              reload();
            }}
          >
            刷新
          </Button>
          <Upload
            name="tools.json"
            maxCount={1}
            accept=".json"
            fileList={[]}
            beforeUpload={(file, fileList) => {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = (result) => {
                let tools = result?.target?.result;
                if (tools) {
                  handleImport(JSON.parse(tools as string));
                }
              };
              return false;
            }}
          >
            <Button type="primary">导入</Button>
          </Upload>
          <Button
            type="primary"
            onClick={() => {
              handleExport();
            }}
          >
            导出
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            items={dataSource.map((i) => i.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={{
                body: {
                  row: Row,
                },
              }}
              rowKey="id"
              dataSource={dataSource}
              rowSelection={{
                type: "checkbox",
                onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
                  setSelectRows(selectedRows);
                },
              }}
              pagination={{
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                defaultPageSize: 10,
                showTotal: (total) => `共 ${total} 条`
              }}
            >
              <Table.Column
                key="sort"
                align="center"
                width={50}
                title="排序"
                render={() => <DragHandle />}
              />
              <Table.Column title="ID" dataIndex="id" width={40} />
              <Table.Column
                title="名称"
                dataIndex="name"
                width={120}
                render={(_, record: any) => {
                  return (
                    <div style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center"
                    }}>
                      {" "}
                        <img
                          src={`/api/img?url=${record.logo}`}
                          width={32}
                          height={32}
                          alt={`${record.name} 的图标`}
                        ></img>
                      <span style={{ marginLeft: 8 }}>{record.name}</span>
                    </div>
                  );
                }}
              />
              <Table.Column
                title="分类"
                dataIndex="catelog"
                width={60}
                filters={getFilter(store?.catelogs || [])}
                onFilter={(value: any, record: any) => {
                  return value === record["catelog"];
                }}
              />
              <Table.Column
                title="网址"
                dataIndex="url"
                width={150}
                render={(url) => (
                  <div style={{
                    wordBreak: 'break-all',
                    whiteSpace: 'normal'
                  }}>
                    {url}
                  </div>
                )}
              />
              {/* <Table.Column
                title={
                  <span>排序
                    <Tooltip title="升序，按数字从小到大排序">
                      <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
                    </Tooltip>
                  </span>
                }
                dataIndex="sort"
                width={50}
              /> */}
              <Table.Column title={
                <span>隐藏
                  <Tooltip title="开启后只有登录后才会展示该工具">
                    <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
                  </Tooltip>
                </span>
              } dataIndex={"hide"} width={50} render={(val) => {
                return Boolean(val) ? "是" : "否"
              }} />
              <Table.Column
                title="操作"
                width={40}
                dataIndex="action"
                key="action"
                render={(_, record: any) => {
                  return (
                    <Space>
                      <Button
                        type="link"
                        onClick={() => {
                          updateForm.setFieldsValue(record);
                          setShowEdit(true);
                        }}
                      >
                        修改
                      </Button>
                      <Popconfirm
                        onConfirm={() => {
                          handleDelete(record.id);
                        }}
                        title={`确定要删除 ${record.name} 吗？`}
                      >
                        <Button type="link">删除</Button>
                      </Popconfirm>
                    </Space>
                  );
                }}
              />
            </Table>
          </SortableContext>
        </DndContext>
      </Spin>
      {<Modal
        open={showAddModel}
        title={"新建工具"}
        onCancel={() => {
          setShowAddModel(false);
          addForm.resetFields();
        }}
        afterClose={() => {
          addForm.resetFields(); // Modal完全关闭后再次重置表单
        }}
        destroyOnClose={true}
        onOk={() => {
          const values = addForm?.getFieldsValue();
          handleCreate(values);
        }}
      >
        <Spin spinning={requestLoading}>
          <Form form={addForm}>
            <Form.Item
              name="name"
              required
              label="名称"
              rules={[{ required: true, message: "请填写名称" }]}
              labelCol={{ span: 4 }}
            >
              <Input placeholder="请输入工具名称" />
            </Form.Item>
            <Form.Item
              name="url"
              rules={[
                { required: true, message: "请填写网址" },
                {
                  pattern: /^(https?:\/\/)/,
                  message: "网址必须以 http:// 或 https:// 开头"
                }
              ]}
              required
              label="网址"
              labelCol={{ span: 4 }}
            >
              <Input placeholder="请输入完整URL（以 http:// 或 https:// 开头）" />
            </Form.Item>
            <Form.Item name="logo" label="logo 网址" labelCol={{ span: 4 }}>
              <Input placeholder="请输入 logo url, 为空则自动获取" />
            </Form.Item>
            <Form.Item
              name="catelog"
              required
              label="分类"
              labelCol={{ span: 4 }}
              rules={[{ required: true, message: "请选择分类" }]}
            >
              <Select
                options={getOptions(store?.catelogs || [])}
                placeholder="请选择分类"
              />
            </Form.Item>
            <Form.Item
              rules={[{ required: true, message: "请填写描述" }]}
              name="desc"
              required
              label="描述"
              labelCol={{ span: 4 }}
            >
              <Input placeholder="请输入描述" />
            </Form.Item>
            <Form.Item
              rules={[{ required: true, message: "请排序" }]}
              name="sort"
              initialValue={1}
              required
              label={
                <span>
                  <Tooltip title="升序，按数字从小到大排序">
                    <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
                  </Tooltip>
                  &nbsp;排序
                </span>
              }
              labelCol={{ span: 4 }}>
              <InputNumber placeholder="请输入排序" />
            </Form.Item>
            <Form.Item
              name="hide"
              initialValue={false}
              required
              label={
                <span>
                  <Tooltip title="开启后只有登录后才会展示该工具">
                    <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
                  </Tooltip>
                  &nbsp;隐藏
                </span>
              }
              labelCol={{ span: 4 }}>
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>}
      {<Modal
        open={showEdit}
        title={"修改工具"}
        destroyOnClose
        onCancel={() => {
          setShowEdit(false);
        }}
        onOk={() => {
          const values = updateForm?.getFieldsValue();
          handleUpdate(values);
        }}
      >
        <Spin spinning={requestLoading}>
          <Form form={updateForm}>
            <Form.Item name="id" label="序号" labelCol={{ span: 4 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="name" required label="名称" labelCol={{ span: 4 }}>
              <Input placeholder="请输入工具名称" />
            </Form.Item>
            <Form.Item name="url" required label="网址" labelCol={{ span: 4 }}>
              <Input placeholder="请输入 url" />
            </Form.Item>
            <Form.Item name="logo" label="logo 网址" labelCol={{ span: 4 }}>
              <Input placeholder="请输入 logo url, 为空则自动获取" />
            </Form.Item>
            <Form.Item
              name="catelog"
              required
              label="分类"
              labelCol={{ span: 4 }}
            >
              <Select
                options={getOptions(store?.catelogs || [])}
                placeholder="请选���分类"
              />
            </Form.Item>
            <Form.Item name="desc" required label="描述" labelCol={{ span: 4 }}>
              <Input placeholder="请输入描述" />
            </Form.Item>

            <Form.Item
              name="sort"
              required
              label={
                <span>
                  <Tooltip title="升序，按数字从小到大排序">
                    <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
                  </Tooltip>
                  &nbsp;排序
                </span>
              }
              labelCol={{ span: 4 }}>
              <InputNumber placeholder="请输入排序" defaultValue={1} />
            </Form.Item>

            <Form.Item
              name="hide"
              required
              label={
                <span>
                  <Tooltip title="开启后只有登录后才会展示该工具">
                    <QuestionCircleOutlined style={{ marginLeft: '5px' }} />
                  </Tooltip>
                  &nbsp;隐藏
                </span>
              }
              labelCol={{ span: 4 }}>
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>}
    </Card>
  );
};
