import { ImageSourcePropType } from "react-native";

interface Spot {
    id: string;
    displayName: string;
    image: ImageSourcePropType;
}

export const spots: Spot[] = [
    { id: "ksl", displayName: "KSL", image: require("../../assets/ksl.png") },
    { id: "tink", displayName: "Tink", image: require("../../assets/tink.png") },
    { id: "pbl", displayName: "PBL", image: require("../../assets/pbl.png") },
    { id: "tomlinson", displayName: "Tomlinson", image: require("../../assets/tomlinson.png") }
];