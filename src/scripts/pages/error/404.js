import animationData from "../../../public/animations/404.json";
import lottie from "lottie-web";

export default class NotFoundPage {
  async render() {
    return `
      <div id="not-found-container" style="text-align: center; padding: 2rem;">
        <div id="not-found-animation" style="width: 300px; margin: auto;"></div>
        <h2>Oops! Halaman tidak ditemukan.</h2>
        <a href="#/">Kembali ke Beranda</a>
      </div>
    `;
  }

  async afterRender() {
    lottie.loadAnimation({
      container: document.getElementById("not-found-animation"),
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: animationData,
    });
  }
}
