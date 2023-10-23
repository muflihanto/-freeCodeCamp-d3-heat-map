import * as d3 from "d3";
import data from "./global-temperature.json";

const tw = (strings: TemplateStringsArray, ...values: string[]) =>
  String.raw({ raw: strings }, ...values);

export default function setupHeatMap(container: HTMLDivElement) {
  // Declare the chart dimensions and margins.
  const width = 1600;
  const height = 600;
  const margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 60,
  };

  // Declare styles
  const styles = {
    heading: tw`flex w-full flex-col items-center`,
    h1: tw`text-2xl font-bold`,
    h3: tw`text-xl font-semibold`,
  };

  // Add title
  const heading = d3.create("heading").attr("class", styles.heading);
  heading
    .append("h1")
    .attr("id", "title")
    .attr("class", styles.h1)
    .text("Monthly Global Land-Surface Temperature");
  heading
    .append("h3")
    .attr("id", "description")
    .attr("class", styles.h3)
    .text(
      `${data.monthlyVariance[0].year} - ${
        data.monthlyVariance[data.monthlyVariance.length - 1].year
      }: base temperature ${data.baseTemperature}\u2103`,
    );

  // Append heading to container
  container.append(heading.node()!);

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "self-start");

  // Declare the x (horizontal position) scale.
  const x = d3
    .scaleBand()
    .domain(data.monthlyVariance.map((el) => `${el.year}`))
    .range([margin.left, width - margin.right]);

  // Declare the y (vertical position) scale.
  const y = d3
    .scaleBand()
    .domain(Array.from({ length: 12 }).map((_, i) => `${i}`))
    .rangeRound([margin.top, height - margin.bottom]);

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(
          x.domain().filter((year) => {
            return parseInt(year) % 10 === 0;
          }),
        )
        .tickFormat((year) => {
          const date = new Date(0);
          date.setUTCFullYear(parseInt(year));
          const format = d3.utcFormat("%Y");
          return format(date);
        }),
    );

  // Add the y-axis.
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues(y.domain())
        .tickFormat((month) => {
          const date = new Date(0);
          date.setUTCMonth(parseInt(month));
          const format = d3.utcFormat("%B");
          return format(date);
        }),
    );

  container.append(svg.node()!);
}
