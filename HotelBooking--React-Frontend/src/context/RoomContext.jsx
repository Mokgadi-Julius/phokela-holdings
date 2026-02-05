import { createContext, useContext, useEffect, useState } from "react";
import { roomsAPI } from "../services/api";

const RoomInfo = createContext();

export const RoomContext = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [adults, setAdults] = useState('1 Adult');
  const [kids, setKids] = useState('0 Kid');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(+adults[0] + +kids[0]);
  }, [adults, kids]);

  const fetchRooms = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await roomsAPI.getAll(filters);
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const resetRoomFilterData = () => {
    setAdults('1 Adult');
    setKids('0 Kid');
    fetchRooms();
  };

  const handleCheck = (e) => {
    e.preventDefault();
    fetchRooms({ minPerson: total });
  };

  const shareWithChildren = {
    rooms,
    loading,
    adults,
    setAdults,
    kids,
    setKids,
    handleCheck,
    resetRoomFilterData,
  };

  return (
    <RoomInfo.Provider value={shareWithChildren}>
      {children}
    </RoomInfo.Provider>
  );
};

export const useRoomContext = () => useContext(RoomInfo);
