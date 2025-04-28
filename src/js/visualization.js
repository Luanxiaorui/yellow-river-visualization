// visualization.js 文件

// 注意：d3库通常是全局可用的，或者需要在构建工具中导入。
// 在这里假设d3已经通过 <script src="..."> 在HTML中加载为全局变量 d3。
// 如果使用构建工具和 import * as d3 from 'd3'，则需要在这里 import d3。


// 导出主可视化函数，接收所有需要的数据和SVG元素
export function createTimelineVisualization(svg, riverGroup, tooltip, containerWidth, containerHeight, svgData, dynastiesData, eventsData) {

    // --- 从这里开始，是绘制和交互逻辑 ---

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
    // 这条路径不带颜色，主要用于获取长度和定位
    const baseRiverPath = riverGroup.append("path")
        .attr("d", riverDAttribute) // 使用提取到的d属性
        .attr("fill", "none")
        .attr("stroke", "lightgray")
        .attr("stroke-width", 2);

    // 获取新创建的基础路径的总长度
    const totalPathLength = baseRiverPath.node().getTotalLength();
    console.log("河流路径总长度:", totalPathLength);

    // --- 4. 定义时间到路径长度的映射 ---
    const minYear = d3.min(dynastiesData, d => d.start);
    const maxYear = d3.max(dynastiesData, d => d.end);
    // 确保时间范围有效
    const validMaxYear = maxYear > minYear ? maxYear : minYear + 1; // 如果只有一个点或范围无效，给个最小范围
    const validMinYear = minYear;
    const totalTimespan = validMaxYear - validMinYear;


    const timeScale = d3.scaleLinear()
        .domain([validMinYear, validMaxYear])
        // 将时间映射到 [0, 路径总长度的一个非常小的百分比]
        .range([0, totalPathLength * 0.9999]); // 调整这里的乘数，使其略小于1
    // 或者 range([0, totalPathLength - 0.1]); 减去一个固定的小值，例如0.1px


    // --- 5. 绘制按朝代分色的河流段 ---
    riverGroup.selectAll(".river-segment")
        .data(dynastiesData)
        .enter()
        .append("path")
        .attr("class", "river-segment")
        .attr("d", riverDAttribute) // 使用提取到的d属性
        .style("stroke", d => d.color) // 设置颜色
        .style("stroke-width", 8)
        .style("fill", "none")
        .style("stroke-linecap", "round")
        .attr("stroke-dasharray", function (d) {
            const startLength = timeScale(d.start);
            const endLength = timeScale(d.end);
            // 计算朝代对应的时间段在路径上的长度
            const segmentLength = Math.max(0, timeScale(d.end) - timeScale(d.start));
            return `${segmentLength} ${totalPathLength - segmentLength}`;
        })
        .attr("stroke-dashoffset", function (d) {
            return -timeScale(d.start);
        })
        // 保留鼠标事件用于显示朝代信息（年份等）提示框
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
    // ... 后续代码不变 ...

    // --- 5b. 在朝代段上直接添加朝代名称文本 ---
    riverGroup.selectAll(".dynasty-label")
        .data(dynastiesData)
        .enter()
        .append("text")
        .attr("class", "dynasty-label")
        .text(d => d.name) // 直接显示朝代名称
        .attr("transform", function (d) {
            // 计算朝代时间段的中心点对应的路径长度
            const startLength = timeScale(d.start);
            const endLength = timeScale(d.end);
            const midLength = startLength + (endLength - startLength) / 2;

            // 确保中心点在有效范围内
            const validMidLength = Math.max(0, Math.min(totalPathLength, midLength));

            let point = { x: -100, y: -100 }; // 默认移出屏幕
            try {
                // 获取中心点在路径上的坐标
                if (baseRiverPath && baseRiverPath.node()) {
                    point = baseRiverPath.node().getPointAtLength(validMidLength);
                }
            } catch (e) {
                console.warn("无法获取朝代文本定位点:", d.name, e);
            }
            // 使用坐标进行平移定位文本
            return `translate(${point.x}, ${point.y})`;
        });
    // .attr("transform", function (d, i) { // 添加索引 i 参数，方便实现交替偏移
    //     // 计算朝代时间段的中心点对应的路径长度
    //     const startLength = timeScale(d.start);
    //     const endLength = timeScale(d.end);
    //     const midLength = startLength + (endLength - startLength) / 2;

    //     // 确保中心点在有效范围内
    //     const validMidLength = Math.max(0, Math.min(totalPathLength, midLength));

    //     let point = null; // 优化：初始化为 null，更安全地判断是否获取到有效点
    //     try {
    //         // 获取中心点在路径上的坐标
    //         if (baseRiverPath && baseRiverPath.node()) {
    //             point = baseRiverPath.node().getPointAtLength(validMidLength);
    //         }
    //     } catch (e) {
    //         console.warn("无法获取朝代文本定位点:", d.name, e);
    //     }

    //     // 检查是否获取到了有效的点坐标
    //     if (point && typeof point.x === 'number' && typeof point.y === 'number') {
    //         // >>>>>>>>> 在这里计算偏移后的最终 Y 坐标 <<<<<<<<<
    //         // 方案一：固定向下偏移
    //         // const offsetY = 12; // 向下偏移距离
    //         // const finalY = point.y + offsetY;

    //         // 方案二：交替向上/向下偏移 (使用索引 i)
    //         const offsetY = (i % 2 === 1) ? 15 : -15; // 偶数索引向下偏移 15，奇数索引向上偏移 15 (距离可调)
    //         const finalY = point.y + offsetY;


    //         // 使用计算好的最终 Y 坐标构建 translate 字符串
    //         return `translate(${point.x}, ${finalY})`;
    //     } else {
    //         // 如果 point 无效 (getPointAtLength 失败)，将文本移到屏幕外，确保不显示
    //         return "translate(-10000, -10000)"; // 一个很大的值，保证在视口外
    //     }
    // });


    // --- 6. 添加历史事件节点 ---
    const eventNodes = riverGroup.selectAll(".event-node")
        .data(eventsData.filter(d => d.year >= validMinYear && d.year <= validMaxYear)) // 只显示在有效时间范围内的事件
        .enter()
        .append("circle")
        .attr("class", "event-node")
        .attr("r", 5)
        .attr("fill", d => {
            if (d.type.includes("科技")) return "purple";
            if (d.type.includes("战争")) return "red";
            if (d.type.includes("人物")) return "green";
            if (d.type.includes("政治")) return "blue";
            return "black"; // 默认颜色
        })
        .attr("transform", function (d) {
            const eventLength = timeScale(d.year);
            if (eventLength < 0 || eventLength > totalPathLength) {
                // 已经被filter排除了，但这提供了额外的保护
                return "translate(-100, -100)"; // 移出可视区
            }
            let point = { x: -100, y: -100 }; // 默认移出屏幕
            try {
                if (baseRiverPath && baseRiverPath.node()) {
                    const point = baseRiverPath.node().getPointAtLength(eventLength);
                    return `translate(${point.x}, ${point.y})`;
                }
            } catch (e) {
                console.error(`无法为事件 "${d.name}" (${d.year}) 在长度 ${eventLength} 处获取点:`, e);
                return "translate(-100, -100)";
            }
            return "translate(-100, -100)"; // 备用返回
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
    const uniqueEventTypes = Array.from(new Set(eventsData.map(d => d.type)));
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