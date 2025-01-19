import { useState } from "react";
import { fetchAdminData } from "../../../utils/api";
import { useOnce } from "../../../utils/useOnce";
import { message } from 'antd';

export const useData = () => {
  const [store, setState] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminData();
      if (data) {
        setState(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }

  useOnce(() => {
    fetchData();
  }, []);

  return {
    store,
    loading,
    reload: fetchData,
  }
}