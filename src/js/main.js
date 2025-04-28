// main.js 文件

// 从 visualization.js 文件中导入渲染函数
// 请将这里的路径 './visualization.js' 修改为 visualization.js 相对于 main.js 的实际路径
import { createTimelineVisualization } from './visualization.js';

// 注意：d3库通常是全局可用的，或者需要在构建工具中导入。
// 在这里假设d3已经通过 <script src="..."> 在HTML中加载为全局变量 d3。


// 确保DOM完全加载后再执行
document.addEventListener('DOMContentLoaded', function () {

    // --- 1. 和 2. 设置 SVG 画布和获取容器元素 ---
    const container = document.getElementById('chart');
    if (!container) {
        console.error("错误：未找到ID为 'chart' 的容器元素！");
        return;
    }

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
    if (tooltip.empty()) {
        console.warn("未找到 class 为 'tooltip' 的提示框元素，部分交互功能可能无法工作。");
    }


    // --- 3. 同时加载所有外部数据 ---
    // 请确保这里的路径与你的文件实际位置相符 (相对于 main.js 或网站根目录，取决于服务方式)
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
            if (svg) svg.append("text").attr("x", 10).attr("y", 20).text("错误：无法加载SVG文件。").attr("fill", "red");
            return;
        }
        if (!dynastiesData || !Array.isArray(dynastiesData)) {
            console.error("朝代数据JSON加载或解析失败:", dynastiesFile, dynastiesData);
            if (svg) svg.append("text").attr("x", 10).attr("y", 40).text("错误：无法加载朝代数据。").attr("fill", "red");
            return;
        }
        if (!eventsData || !Array.isArray(eventsData)) {
            console.error("事件数据JSON加载或解析失败:", eventsFile, eventsData);
            if (svg) svg.append("text").attr("x", 10).attr("y", 60).text("错误：无法加载事件数据。").attr("fill", "red");
            return;
        }

        // --- 调用可视化函数进行渲染 ---
        createTimelineVisualization(svg, riverGroup, tooltip, containerWidth, containerHeight, svgData, dynastiesData, eventsData);

    }).catch(function (error) { // Promise.all 的 catch 块捕获任何加载错误
        console.error("加载数据或SVG失败:", error);
        if (svg) {
            svg.append("text")
                .attr("x", 10)
                .attr("y", 20)
                .text("错误：加载资源失败，请检查文件路径或网络。")
                .attr("fill", "red");
        } else {
            console.error("SVG容器创建失败或未找到");
        }
    });
}); // DOMContentLoaded 结束