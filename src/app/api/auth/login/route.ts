// Alias of /api/login. Some integrations/specs reference /api/auth/login;
// both mint the same signed session cookie.
export { POST } from "../../login/route";
