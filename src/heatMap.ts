import * as d3 from "d3";
import d3Tip from "d3-tip";
import data from "./global-temperature.json";

const tw = (strings: TemplateStringsArray, ...values: string[]) =>
  String.raw({ raw: strings }, ...values);

export default function setupHeatMap(app: HTMLDivElement) {
  // Declare the chart dimensions and margins.
  const width = 1600;
  const height = 560;
  const margin = {
    top: 20,
    right: 20,
    bottom: 120,
    left: 90,
  };

  // Declare styles
  const styles = {
    container:
      "container mx-auto p-8 flex flex-col items-center mt-2 max-w-full",
    scrollContainer: "w-full overflow-scroll max-w-full",
    heading: tw`flex w-full flex-col items-center`,
    h1: tw`text-2xl font-bold`,
    h3: tw`text-xl font-semibold`,
    xLabel: tw`fill-black text-sm [text-anchor:middle]`,
    yLabel: tw`-rotate-90 fill-black text-sm [text-anchor:middle]`,
    cell: tw`cell hover:stroke-black`,
    tooltip: tw`flex min-w-[50px] flex-col items-center rounded-md bg-black/80 px-3 py-2 font-semibold text-white`,
  };

  const container = d3
    .select(app)
    .append("div")
    .attr("id", "container")
    .classed(styles.container, true)
    .node()!;

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

  const scrollContainer = d3
    .create("div")
    .attr("id", "scrollContainer")
    .classed(styles.scrollContainer, true);

  const tip = d3Tip()
    .attr("class", styles.tooltip)
    .attr("id", "tooltip")
    .html((d: (typeof data.monthlyVariance)[number]) => {
      return [
        d3.utcFormat("%Y - %B")(new Date(d.year, d.month)),
        d3.format(".1f")(data.baseTemperature + d.variance) + "&#8451;",
        d3.format("+.1f")(d.variance) + "&#8451;",
      ]
        .map((el) => `<span>${el}</span>`)
        .join("");
    })
    .direction("n")
    .offset([-10, 0]);

  // Create the SVG container.
  const svg = scrollContainer
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "self-start")
    .call(tip);

  // Calculate color scale domain
  const colorLength = 11;
  const [minTemp, maxTemp] = d3.extent(
    data.monthlyVariance,
    (d) => d.variance + data.baseTemperature,
  ) as [number, number];
  const step = (maxTemp - minTemp) / colorLength;
  const colorDomain = Array.from({ length: colorLength }).map(
    (_, i) => minTemp + (i + 1) * step,
  );

  // Declare color scale
  const color = d3.scaleThreshold(
    colorDomain,
    (d3.schemeRdYlBu[colorLength] as string[]).reverse(),
  );

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
    .attr("id", "x-axis")
    .call(
      d3
        .axisBottom(x)
        .tickValues(x.domain().filter((year) => parseInt(year) % 10 === 0)),
    );

  // Add the y-axis.
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("id", "y-axis")
    .call(
      d3
        .axisLeft(y)
        .tickValues(y.domain())
        .tickFormat((month) => {
          const date = new Date(0);
          date.setUTCMonth(parseInt(month));
          return d3.utcFormat("%B")(date);
        }),
    );

  // Add map
  svg
    .append("g")
    .classed("map", true)
    .selectAll("rect")
    .data(data.monthlyVariance)
    .enter()
    .append("rect")
    .classed(styles.cell, true)
    .attr("data-month", (d) => d.month - 1)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => data.baseTemperature + d.variance)
    .attr("x", (d) => x(String(d.year)) ?? 0)
    .attr("y", (d) => y(String(d.month - 1)) ?? 0)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", (d) => color(data.baseTemperature + d.variance))
    .on("mouseover", function (_, d) {
      tip.attr("data-year", d.year);
      tip.show<(typeof data.monthlyVariance)[number]>(d, this);
    })
    .on("mouseout", tip.hide);

  // Add x-axis label
  svg
    .append("text")
    .text("Years")
    .classed(styles.xLabel, true)
    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    .attr("y", height - margin.bottom + 40);

  // Add y-axis label
  svg
    .append("text")
    .text("Months")
    .classed(styles.yLabel, true)
    .attr("x", (-1 / 2) * (height - margin.bottom - margin.top) - margin.top)
    .attr("y", 20);

  // Declare legend dimensions
  const legendHeight = 24;
  const legendWidth = 400;

  // Declare the legend horizontal position scale.
  const legendX = d3.scaleLinear([minTemp, maxTemp], [0, legendWidth]);

  // Add legend x-axis
  const legendXAxis = d3
    .axisBottom(legendX)
    .tickSize(10)
    .tickValues(color.domain())
    .tickFormat(d3.format(".1f"));

  // Add legend group
  const legend = svg
    .append("g")
    .classed("legend", true)
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${margin.left},${
        height - margin.bottom + 48 - (2 * legendHeight) / 11
      })`,
    );

  // Add legend rects group
  legend
    .append("g")
    .selectAll("rect")
    .data(
      color.range().map((r) => {
        const [c0, c1] = color.invertExtent(r);
        const [d0, d1] = legendX.domain();
        return [c0 ?? d0, c1 ?? d1];
      }),
    )
    .enter()
    .append("rect")
    .style("fill", (d) => color(d[0]))
    .style("stroke", "black")
    .attr("x", (d) => legendX(d[0]))
    .attr("y", 0)
    .attr("width", (d) => legendX(d[1]) - legendX(d[0]))
    .attr("height", legendHeight);

  // Call the legend axis
  legend
    .append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(legendXAxis);

  // Append svg to container
  container.append(scrollContainer.node()!);
}
