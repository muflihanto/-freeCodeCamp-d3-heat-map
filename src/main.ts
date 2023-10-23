import setupHeatMap from "./heatMap";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML =
  "<div id='container' class='container mx-auto p-8 flex flex-col items-center mt-2 max-w-full overflow-scroll'></div>";

setupHeatMap(document.querySelector("#container") as HTMLDivElement);
