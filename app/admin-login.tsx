import { Redirect } from "expo-router";

export default function AdminLoginRedirect() {
  return <Redirect href={"/(admin)/login" as any} />;
}
