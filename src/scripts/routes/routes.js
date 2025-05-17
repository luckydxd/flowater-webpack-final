import HomePage from "../pages/home/home-page";
import LaporanPage from "../pages/laporan/laporan-page";
import AddLaporanPage from "../pages/addlaporan/add-laporan-page";
import LoginPage from "../pages/auth/login/login-page";
import RegisterPage from "../pages/auth/register/register-page";
import DetailPage from "../pages/detail/detail-page";
import NotFoundPage from "../pages/error/404";

import {
  checkAuthenticatedRoute,
  checkUnauthenticatedRouteOnly,
} from "../utils/auth";

const routes = {
  "/": () => checkAuthenticatedRoute(new HomePage()),
  "/laporan": () => checkAuthenticatedRoute(new LaporanPage()),
  "/detail/:id": checkAuthenticatedRoute(new DetailPage()),
  "/addLaporan": () => new AddLaporanPage(),

  "/login": () => checkUnauthenticatedRouteOnly(new LoginPage()),
  "/register": () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  "*": () => new NotFoundPage(),

  // Alternatif jika ingin menangani error khusus
  "/404": () => new NotFoundPage(),
};

export default routes;
