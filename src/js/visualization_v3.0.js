// visualization.js 文件

// 导出主可视化函数，接收所有需要的数据和SVG元素
export function createTimelineVisualization(svg, riverGroup, tooltip, containerWidth, containerHeight, svgData, dynastiesData, eventsData) {

    // --- 从这里开始，是原来 Promise.all().then(...) 里面的所有代码 ---
    // 现在使用传递进来的参数: svgData, dynastiesData, eventsData, svg, riverGroup, tooltip, containerWidth, containerHeight

    // 查找导入的 SVG 文档中的路径元素
    const importedRiverPathNode = svgData.documentElement.querySelector("#yellow_river");

    if (!importedRiverPathNode) {
        console.error("错误：在 SVG 文件中找不到 ID 为 'yellow_river' 的路径！请检查SVG文件和ID。");
        // 在SVG上显示错误信息，需要确保svg对象可用
        svg.append("text").attr("x", 10).attr("y", 20).text("错误：无法找到河流路径元素").attr("fill", "red");
        return; // 停止执行
    }

    // *** 提取路径的 'd' 属性值 ***
    const riverDAttribute = importedRiverPathNode.getAttribute('d');

    // *** 在我们的主 SVG 中绘制一条基础河流路径 ***
    const baseRiverPath = riverGroup.append("path")
        .attr("d", riverDAttribute) // 使用提取到的d属性
        .attr("fill", "none")
        .attr("stroke", "lightgray")
        .attr("stroke-width", 2);

    // 获取新创建的基础路径的总长度
    const totalPathLength = baseRiverPath.node().getTotalLength();
    console.log("河流路径总长度:", totalPathLength);

    // --- 4. 定义时间到路径长度的映射 ---
    // 使用 dynastiesData
    const minYear = d3.min(dynastiesData, d => d.start);
    const maxYear = d3.max(dynastiesData, d => d.end);
    const totalTimespan = maxYear - minYear;

    const timeScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, totalPathLength]);


    // --- 5. 绘制按朝代分色的河流段 ---
    // 使用 dynastiesData
    riverGroup.selectAll(".river-segment")
        .data(dynastiesData)
        .enter()
        .append("path")
        .attr("class", "river-segment")
        .attr("d", riverDAttribute) // 使用提取到的d属性
        .style("stroke", d => d.color) // 设置颜色
        .style("stroke-width", 8) // 应用CSS中的宽度
        .style("fill", "none") // 应用CSS中的fill:none
        .style("stroke-linecap", "round") // 应用CSS中的linecap
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
                // 根据鼠标位置调整提示框位置
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


    // --- 6. 添加历史事件节点 ---
    // 使用 eventsData
    const eventNodes = riverGroup.selectAll(".event-node")
        .data(eventsData.filter(d => d.year >= minYear && d.year <= maxYear)) // 只显示在时间范围内的事件，使用 eventsData
        .enter()
        .append("circle")
        .attr("class", "event-node")
        .attr("r", 5)
        .attr("fill", d => { // 根据事件类型给不同颜色 (这个逻辑需要复制到图例生成处)
            if (d.type.includes("科技")) return "purple";
            if (d.type.includes("战争")) return "red";
            if (d.type.includes("人物")) return "green";
            if (d.type.includes("政治")) return "blue"; // 增加政治类型颜色
            return "black"; // 默认颜色
        })
        .attr("transform", function (d) {
            const eventLength = timeScale(d.year);
            if (eventLength < 0 || eventLength > totalPathLength) {
                console.warn(`事件 "${d.name}" (${d.year}) 超出路径范围，无法定位。`);
                return "translate(-100, -100)";
            }
            try {
                // 使用 baseRiverPath 计算点
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
    // 使用 eventsData
    const uniqueEventTypes = Array.from(new Set(eventsData.map(d => d.type))); // 使用 eventsData
    const legendData = ["全部"].concat(uniqueEventTypes);

    const legend = d3.select("#legend");

    // 定义一个函数来获取事件类型的颜色 (需要和上面绘制节点时的颜色逻辑一致)
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
}

// 注意：d3库本身不是通过export导出的，它通常是全局的（挂在window.d3上）
// 或者在使用打包工具时通过import导入。在简单的浏览器环境中，我们直接使用全局的d3。
// 如果使用 import * as d3 from 'd3'; 需要构建工具支持。
// 为了兼容简单的文件引用，我们这里不使用 import d3。