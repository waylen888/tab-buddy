
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

import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LiquorIcon from '@mui/icons-material/Liquor';
import TapasIcon from '@mui/icons-material/Tapas';

import ChildCareIcon from '@mui/icons-material/ChildCare';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import SchoolIcon from '@mui/icons-material/School';
import RedeemIcon from '@mui/icons-material/Redeem';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import CalculateIcon from '@mui/icons-material/Calculate';
import SupportIcon from '@mui/icons-material/Support';


import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

export interface Category {
  key: string;
  name: string;
  icon: React.ReactNode;
}

const transportationColor = "#996666"
const foodAndDrinkColor = "#669966"
const lifeColor = "#666699"

export const CATEGORIES = [
  {
    title: "Uncategorized",
    subCategories: [
      { key: "", name: "General", icon: <ReceiptSharpIcon htmlColor="gray" /> },
    ],
  },
  {
    title: "Food and drink",
    subCategories: [
      { key: "dining_out", name: "Dining out", icon: <RestaurantIcon htmlColor={foodAndDrinkColor} /> },
      { key: "groceries", name: "Groceries", icon: <ShoppingCartIcon htmlColor={foodAndDrinkColor} /> },
      { key: "liquor", name: "Liquor", icon: <LiquorIcon htmlColor={foodAndDrinkColor} /> },
      { key: "food_drink_other", name: "Other", icon: <TapasIcon htmlColor={foodAndDrinkColor} /> },
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
      { key: "transportation_other", name: "Other", icon: <CommuteIcon htmlColor={transportationColor} /> },
    ],
  },
  {
    title: "Entertainment",
    subCategories: [
      { key: "games", name: "Games", icon: <SportsEsportsIcon htmlColor={foodAndDrinkColor} /> },
      { key: "movies", name: "Movies", icon: <TheaterComedyIcon htmlColor={foodAndDrinkColor} /> },
      { key: "music", name: "Music", icon: <AudiotrackIcon htmlColor={foodAndDrinkColor} /> },
      { key: "sports", name: "Sports", icon: <SportsFootballIcon htmlColor={foodAndDrinkColor} /> },
      { key: "entertainment_other", name: "Other", icon: <ConfirmationNumberIcon htmlColor={foodAndDrinkColor} /> },
    ],
  },
  {
    title: "Life",
    subCategories: [
      { key: "childcare", name: "Childcare", icon: <ChildCareIcon htmlColor={lifeColor} /> },
      { key: "clothing", name: "Clothing", icon: <CheckroomIcon htmlColor={lifeColor} /> },
      { key: "education", name: "Education", icon: <SchoolIcon htmlColor={lifeColor} /> },
      { key: "gifts", name: "Gifts", icon: <RedeemIcon htmlColor={lifeColor} /> },
      { key: "insurance", name: "Insurance", icon: <ReceiptLongIcon htmlColor={lifeColor} /> },
      { key: "medical_expenses", name: "Medical expenses", icon: <VaccinesIcon htmlColor={lifeColor} /> },
      { key: "taxes", name: "Taxes", icon: <CalculateIcon htmlColor={lifeColor} /> },
      { key: "life_other", name: "Other", icon: <SupportIcon htmlColor={lifeColor} /> },
    ],
  }
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