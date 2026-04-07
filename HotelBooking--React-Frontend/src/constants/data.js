import { FaCheck } from "react-icons/fa";
import images from "../assets";


export const adultsList = [
    { name: '1 Adult' },
    { name: '2 Adults' },
    { name: '3 Adults' },
    { name: '4 Adults' },
]


export const kidsList = [
    { name: '0 Kid' },
    { name: '1 Kid' },
    { name: '2 Kids' },
    { name: '3 Kids' },
    { name: '4 Kids' },
]


export const sliderData = [
    {
        id: 1,
        title: 'Welcome to Phokela Guest House',
        bg: images.Slider1,
        btnNext: 'Explore Our Services',
        link: '/accommodation'
    },
    {
        id: 2,
        title: 'Premium Accommodation & Event Hosting',
        bg: images.Slider2,
        btnNext: 'Book Your Stay',
        link: '/events'
    },
    {
        id: 3,
        title: 'Catering & Conference Solutions',
        bg: images.Slider3,
        btnNext: 'Contact Us Today',
        link: '/contact'
    },
]


export const guestHouseRules = [
    {
        rules: 'Check-in : 2:00 PM - 8:00 PM',
    },
    {
        rules: 'Check-out : 11:00 AM',
    },
    {
        rules: 'Smoking in designated areas only',
    },
    {
        rules: 'Pets allowed with prior arrangement',
    },
    {
        rules: 'Quiet hours : 10:00 PM - 7:00 AM',
    },
    {
        rules: 'Conference bookings require 48-hour notice',
    },
]