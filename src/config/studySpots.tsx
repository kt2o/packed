import { ImageSourcePropType } from "react-native";

interface Spot {
    id: string;
    displayName: string;
    image: ImageSourcePropType;
}
export const spots: Spot[] = [
{ id: "ksl", displayName: "KSL",
image: require("../../assets/ksl.png"),
lat: 41.507386829405924,
lng: -81.60966697850489,
radius: 30, },
{ id: "tink",
displayName: "Tink",
image: require("../../assets/tink.png"),
lat: 41.50811997396701,
lng: -81.60880062499287,
radius: 50, },
{ id: "pbl",
displayName: "PBL",
image: require("../../assets/pbl.png"),
lat: 41.50994978625697,
lng: -81.6080522886778,
radius: 50, },
{ id: "tomlinson",
displayName: "Tomlinson",
image: require("../../assets/tomlinson.png"),
lat: 41.50404639714933,
lng: -81.60959992327929,
radius: 30,
},
];