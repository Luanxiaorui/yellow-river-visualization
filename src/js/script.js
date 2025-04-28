// --- 1. 准备数据 (现在将从JSON文件加载，这里只保留结构或示例，但实际代码会删除) ---
// const dynasties = [...]; // 删除这部分
// const events = [...]; // 删除这部分

// --- 2. 设置 SVG 画布 ---
const container = document.getElementById('chart');
const containerRect = container.getBoundingClientRect();
const containerWidth = containerRect.width || 1000;
const containerHeight = containerRect.height || 600;

const svg = d3.select("#chart").append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .style("background-color", "#f0f0f0");

const riverGroup = svg.append("g").attr("id", "river-group");
const tooltip = d3.select(".tooltip");

// --- 3. 同时加载所有外部数据 ---
// 请确保这里的路径与你的文件实际位置相符
const svgFile = "/assets/images/Yellow_river.svg"; // 黄河SVG路径
const dynastiesFile = "/data/dynasties.json";     // 朝代数据JSON路径
const eventsFile = "/data/events.json";         // 事件数据JSON路径

Promise.all([
    d3.xml(svgFile),
    d3.json(dynastiesFile),
    d3.json(eventsFile)
]).then(function (results) { // results 是一个数组，包含了上面三个加载操作的结果
    const svgData = results[0];      // 对应 d3.xml(svgFile) 的结果
    const dynastiesData = results[1]; // 对应 d3.json(dynastiesFile) 的结果
    const eventsData = results[2];    // 对应 d3.json(eventsFile) 的结果

    // --- 检查数据是否成功加载和解析 ---
    if (!svgData) {
        console.error("SVG文件加载失败:", svgFile);
        svg.append("text").attr("x", 10).attr("y", 20).text("错误：无法加载SVG文件。").attr("fill", "red");
        return;
    }
    if (!dynastiesData || !Array.isArray(dynastiesData)) {
        console.error("朝代数据JSON加载或解析失败:", dynastiesFile, dynastiesData);
        svg.append("text").attr("x", 10).attr("y", 40).text("错误：无法加载朝代数据。").attr("fill", "red");
        return;
    }
    if (!eventsData || !Array.isArray(eventsData)) {
        console.error("事件数据JSON加载或解析失败:", eventsFile, eventsData);
        svg.append("text").attr("x", 10).attr("y", 60).text("错误：无法加载事件数据。").attr("fill", "red");
        return;
    }


    // --- 从这里开始，是原来 d3.xml().then(...) 里面的所有代码 ---
    // 但是现在使用的是加载到的 dynastiesData 和 eventsData 变量

    // 查找导入的 SVG 文档中的路径元素
    const importedRiverPathNode = svgData.documentElement.querySelector("#yellow_river");

    if (!importedRiverPathNode) {
        console.error("错误：在 SVG 文件中找不到 ID 为 'yellow_river' 的路径！请检查SVG文件和ID。", svgFile);
        riverGroup.append("text").text("无法找到河流路径元素").attr("x", 10).attr("y", 20).attr("fill", "red");
        return;
    }

    // *** 提取路径的 'd' 属性值 ***
    const riverDAttribute = importedRiverPathNode.getAttribute('d');

    // *** 在我们的主 SVG 中绘制一条基础河流路径 ***
    const baseRiverPath = riverGroup.append("path")
        .attr("d", riverDAttribute)
        .attr("fill", "none")
        .attr("stroke", "lightgray")
        .attr("stroke-width", 2);

    const totalPathLength = baseRiverPath.node().getTotalLength();
    console.log("河流路径总长度:", totalPathLength);

    // --- 4. 定义时间到路径长度的映射 ---
    // 现在使用 dynastiesData
    const minYear = d3.min(dynastiesData, d => d.start);
    const maxYear = d3.max(dynastiesData, d => d.end);
    const totalTimespan = maxYear - minYear;

    const timeScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, totalPathLength]);


    // --- 5. 绘制按朝代分色的河流段 ---
    // 现在使用 dynastiesData
    riverGroup.selectAll(".river-segment")
        .data(dynastiesData)
        .enter()
        .append("path")
        .attr("class", "river-segment")
        .attr("d", riverDAttribute) // 使用提取到的d属性
        .style("stroke", d => d.color)
        .style("stroke-width", 8)
        .style("fill", "none")
        .style("stroke-linecap", "round")
        .attr("stroke-dasharray", function (d) {
            const startLength = timeScale(d.start);
            const endLength = timeScale(d.end);
            const segmentLength = Math.max(0, endLength - startLength);
            return `${segmentLength} ${totalPathLength - segmentLength}`;
        })
        .attr("stroke-dashoffset", function (d) {
            return -timeScale(d.start);
        })
        // 添加鼠标事件用于显示朝代信息提示框
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            const startYear = d.start > 0 ? d.start + '年' : '公元前' + Math.abs(d.start) + '年';
            const endYear = d.end > 0 ? d.end + '年' : '公元前' + Math.abs(d.end) + '年';
            tooltip.html(`${d.name}朝<br>(${startYear} ~ ${endYear})`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


    // --- 6. 添加历史事件节点 ---
    // 现在使用 eventsData
    const eventNodes = riverGroup.selectAll(".event-node")
        .data(eventsData.filter(d => d.year >= minYear && d.year <= maxYear)) // 只显示在时间范围内的事件，使用 eventsData
        .enter()
        .append("circle")
        .attr("class", "event-node")
        .attr("r", 5)
        .attr("fill", d => { // 根据事件类型给不同颜色
            if (d.type.includes("科技")) return "purple";
            if (d.type.includes("战争")) return "red";
            if (d.type.includes("人物")) return "green";
            if (d.type.includes("政治")) return "blue";
            return "black"; // 默认颜色
        })
        .attr("transform", function (d) {
            const eventLength = timeScale(d.year);
            if (eventLength < 0 || eventLength > totalPathLength) {
                console.warn(`事件 "${d.name}" (${d.year}) 超出路径范围，无法定位。`);
                return "translate(-100, -100)";
            }
            try {
                const point = baseRiverPath.node().getPointAtLength(eventLength);
                return `translate(${point.x}, ${point.y})`;
            } catch (e) {
                console.error(`无法为事件 "${d.name}" (${d.year}) 在长度 ${eventLength} 处获取点:`, e);
                return "translate(-100, -100)";
            }
        })
        // 添加交互式提示框
        .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 8);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${d.name}<br>(${d.year > 0 ? d.year : '公元前' + Math.abs(d.year)}年)<br>类型: ${d.type}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            d3.select(this).attr("r", 5);
            tooltip.transition().duration(500).style("opacity", 0);
        });


    // *** 应用整体缩放和平移到 riverGroup ***
    const pathBBox = baseRiverPath.node().getBBox();
    if (pathBBox.width > 0 && pathBBox.height > 0) {
        const scaleFactor = Math.min(
            containerWidth / pathBBox.width,
            containerHeight / pathBBox.height
        ) * 0.9;

        const translateX = (containerWidth - pathBBox.width * scaleFactor) / 2 - pathBBox.x * scaleFactor;
        const translateY = (containerHeight - pathBBox.height * scaleFactor) / 2 - pathBBox.y * scaleFactor;

        riverGroup.attr("transform", `translate(${translateX}, ${translateY}) scale(${scaleFactor})`);
    } else {
        console.warn("无法获取河流路径的边界框（BBox），无法自动缩放。");
    }

    // --- 7. 创建事件类型图例和筛选功能 ---
    // 现在使用 eventsData
    const uniqueEventTypes = Array.from(new Set(eventsData.map(d => d.type))); // 使用 eventsData
    const legendData = ["全部"].concat(uniqueEventTypes);

    const legend = d3.select("#legend");

    function getEventTypeColor(type) {
        if (type.includes("科技")) return "purple";
        if (type.includes("战争")) return "red";
        if (type.includes("人物")) return "green";
        if (type.includes("政治")) return "blue";
        return "black";
    }

    const legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .text(d => d)
        .on("click", function (event, selectedType) {
            legendItems.classed("active", false);
            d3.select(this).classed("active", true);

            eventNodes.style("display", function (d) {
                if (selectedType === "全部") {
                    return null;
                } else {
                    return d.type.includes(selectedType) ? null : "none";
                }
            });
        });

    legendItems.insert("span", ":first-child")
        .attr("class", "legend-swatch")
        .style("background-color", function (d) {
            return d === "全部" ? "lightgray" : getEventTypeColor(d);
        });

    legend.select(".legend-item").classed("active", true);


}).catch(function (error) { // Promise.all 的 catch 块捕获任何加载错误
    console.error("加载数据或SVG失败:", error);
    svg.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text("错误：加载资源失败，请检查文件路径或网络。")
        .attr("fill", "red");
    // 您可以根据 error 的类型或内容，添加更具体的错误提示
});
