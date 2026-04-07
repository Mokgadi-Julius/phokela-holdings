import { createContext, useContext, useEffect, useState } from "react";
import { roomsAPI } from "../services/api";

const RoomInfo = createContext();

export const RoomContext = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState(false); // true when a filter is active

  const [adults, setAdults] = useState('1 Adult');
  const [kids, setKids] = useState('0 Kid');

  // Derive total number of guests from the selected strings
  const getTotal = (adultsStr, kidsStr) => {
    return parseInt(adultsStr) + parseInt(kidsStr);
  };

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
    setFiltered(false);
    fetchRooms();
  };

  const handleCheck = (e, checkIn = null, checkOut = null) => {
    e.preventDefault();

    const total = getTotal(adults, kids);

    // Backend supports: minCapacity, type, minPrice, maxPrice, availability, featured
    const filters = {};

    // Only filter by capacity if more than 1 person is selected
    if (total > 1) {
      filters.minCapacity = total;
    }

    // Mark that a filter has been applied
    setFiltered(true);

    fetchRooms(filters);

    // Scroll to the rooms section smoothly
    const roomsSection = document.getElementById('rooms-section');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const shareWithChildren = {
    rooms,
    loading,
    filtered,
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
