import { createContext, useContext, useEffect, useState } from "react";
import { roomsAPI } from "../services/api";
import { roomData } from "../db/data";

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
      let apiRooms = [];
      try {
        const res = await roomsAPI.getAll(filters);
        if (res.data) {
          apiRooms = res.data;
        }
      } catch (apiErr) {
        // Silently fallback to local storage
      }

      // Load from local storage
      const localRooms = JSON.parse(localStorage.getItem('local_rooms') || '[]');
      
      // Merge sources
      const combined = [...apiRooms, ...localRooms];

      if (combined.length > 0) {
        let data = combined;
        if (filters.minPerson) {
          data = data.filter(r => (r.capacity || r.maxPerson) >= filters.minPerson);
        }
        setRooms(data);
      } else {
        // Fallback to static roomData if no dynamic rooms exist
        console.warn("No rooms in API or local storage, using static fallback");
        let data = roomData;
        if (filters.minPerson) {
          data = data.filter(r => (r.capacity || r.maxPerson) >= filters.minPerson);
        }
        setRooms(data);
      }
    } catch (error) {
      console.error("Failed to process rooms data:", error);
      setRooms(roomData);
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
