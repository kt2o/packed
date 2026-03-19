import { ImageSourcePropType } from "react-native";

interface Spot {
    id: string;
    displayName: string;
    image: ImageSourcePropType;
    lat: number;
    lng: number;
    radius: number;
    capacity: number;
    floors?: Floor[]; //optional
}

interface Floor {
    id: string;
    displayName: string;
}

export const spots: Spot[] = [{
    id: "ksl", displayName: "KSL",
    image: require("../../assets/ksl.png"),
    lat: 41.507386829405924,
    lng: -81.60966697850489,
    radius: 30,
    capacity: 1000,
    floors: [
        {
            id: "ksl1", displayName: "Floor 1",
        },
        {
            id: "ksl2", displayName: "Floor 2",
        },
        {
            id: "ksl3", displayName: "Floor 3",
        }
        ]
    },
   {
   id: "tink",
   displayName: "Tink",
   image: require("../../assets/tink.png"),
   lat: 41.50811997396701,
   lng: -81.60880062499287,
   radius: 50,
   capacity: 550,
   floors: [
            {   id: "tink1", displayName: "Main Floor"  },
            {   id: "tink2", displayName: "Second Floor"    }

        ]
   },
   {
   id: "pbl",
   displayName: "PBL",
   image: require("../../assets/pbl.png"),
   lat: 41.50994978625697,
   lng: -81.6080522886778,
   radius: 50,
   capacity: 700,
   floors: [
            {   id:"pbl1", displayName: "Floor 1"},
            {   id:"pbl2", displayName: "Floor 2"},
            {   id:"pbl3", displayName: "Floor 3"},
            {   id:"pbl4", displayName: "Floor 4"},
        ]
   },
   {
   id: "tomlinson",
   displayName: "Tomlinson",
   image: require("../../assets/tomlinson.png"),
   lat: 41.50404639714933,
   lng: -81.60959992327929,
   radius: 30,
   capacity: 350,
   floors: [
            {   id:"tom1", displayName: "Basement" },
            {   id:"tom2", displayName: "Main Floor"}
        ]
   },

];