
import { lazy } from 'react';
import ReceiptSharpIcon from '@mui/icons-material/ReceiptSharp';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import TrainIcon from '@mui/icons-material/Train';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import FlightIcon from '@mui/icons-material/Flight';
import CommuteIcon from '@mui/icons-material/Commute';
export interface Category {
  key: string;
  name: string;
  icon: React.ReactNode;
}
const transportationColor = "#996666"
export const CATEGORIES = [
  {
    title: "Uncategorized",
    subCategories: [
      { key: "", name: "General", icon: <ReceiptSharpIcon htmlColor="gray" /> },
    ],
  },
  {
    title: "Transportation",
    subCategories: [
      { key: "bicycle", name: "Bicycle", icon: <DirectionsBikeIcon htmlColor={transportationColor} /> },
      { key: "bus_train", name: "Bus/Train", icon: <TrainIcon htmlColor={transportationColor} /> },
      { key: "car", name: "Car", icon: <DirectionsCarIcon htmlColor={transportationColor} /> },
      { key: "gas_fuel", name: "Gas/fuel", icon: <LocalGasStationIcon htmlColor={transportationColor} /> },
      { key: "hotel", name: "Hotel", icon: <HotelIcon htmlColor={transportationColor} /> },
      { key: "parking", name: "Parking", icon: <LocalParkingIcon htmlColor={transportationColor} /> },
      { key: "plane", name: "Plane", icon: <FlightIcon htmlColor={transportationColor} /> },
      { key: "taxi", name: "Taxi", icon: <LocalTaxiIcon htmlColor={transportationColor} /> },
      { key: "other", name: "Other", icon: <CommuteIcon htmlColor={transportationColor} /> },
    ],
  },
]
export const getCategoryGroup = (key: string) => {
  const group = CATEGORIES.find(category => category.subCategories.find(subCategory => subCategory.key === key))
  return group
}
export const getCategory = (key: string) => {
  const category = CATEGORIES.find(category => category.subCategories.find(subCategory => subCategory.key === key))
  const cat = category?.subCategories.find(subCategory => subCategory.key === key)
  return cat
}

const getCategoryIcon = (key: string) => {

  return getCategory(key)?.icon
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  return getCategoryIcon(category)
}

export default CategoryIcon;