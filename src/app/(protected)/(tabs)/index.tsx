import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkPermission() {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === "granted") {
        router.replace("/home");
      } else {
        router.replace("/location-permission");
      }
    }

    checkPermission();
  }, []);

  return null;
}
