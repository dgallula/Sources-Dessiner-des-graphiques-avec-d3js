import {area, axisBottom, axisLeft, axisRight, create, csv, easeCubic, extent, scaleBand, scaleLinear} from 'd3'
import './style.css'
import {debounce} from "./time.js";

/**
 * @typedef {{deaths: number, births: number, year: number}} Datum
 */

let width = window.innerWidth
let height = window.innerHeight - 50
const input = document.querySelector('input')
let transitionDuration = 0;

const $svg = create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

const $gradient = $svg.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 1)
    .attr('y2', 1)

$gradient.append('stop')
    .attr('class', 'stop1')
    .attr('offset', '0%')

$gradient.append('stop')
    .attr('class', 'stop2')
    .attr('offset', '100%')

const padding = [40, 40, 40, 40]

/** @var {Datum[]} */
let data  = []

let x; // Will be defined when drawing bars

const $bottomAxis = $svg.append('g').attr('class', 'axis')
const $leftAxis = $svg.append('g').attr('class', 'axis')
const $rightAxis = $svg.append('g').attr('class', 'axis')

$svg.append('path')
    .attr('class', 'area')

$svg.selectAll()
    .data(data)
    .join('circle')

const $populationLabel = $svg.append('text').text('Population').attr('class', 'legend')
const $rightLabel = $svg.append('text').text('Population').attr('class', 'legend')

/**
 * Dessine la ligne décès / naissance
 */
const drawLine = () => {
    const accessor = d => input.checked ? d.deaths : d.births

    // Dessine l'axe de droite
    const y = scaleLinear(extent(data, accessor), yRange()).nice()
    $rightAxis
        .transition()
        .duration(transitionDuration)
        .attr('transform', `translate(${x.range()[1]}, 0)`)
        .call(
            axisRight(y)
                .tickFormat(v => v.toString().slice(0, -3) + 'K')
        )

    // Positionne la légende
    $rightLabel
        .text(input.checked ? 'Décès' : 'Naissances')
        .transition()
        .duration(transitionDuration)
        .attr('x', x.range()[1] - 10)
        .attr('text-anchor', 'end')
        .attr('y', y.range()[1])

    // Positionne les points
    $svg
        .selectAll('.point')
        .data(data)
        .join(
            enter => enter.append('circle')
                .attr('class','point')
                .attr('r', 5)
                .attr('fill', 'blue'),
            update => update,
            exit => exit.remove()
        )
        .transition()
        .duration(transitionDuration)
        .ease(easeCubic)
        .attr('cx', d => x(d.year) + x.bandwidth() / 2)
        .attr('cy', d => y(accessor(d)))

    $svg.selectAll('.area')
        .transition()
        .duration(transitionDuration)
        .ease(easeCubic)
        .attr('d', area()
            .y0(y.range()[0])
            .y1(d => y(accessor(d)))
            .x(d => x(d.year) + x.bandwidth() / 2)(data)
        )
}

/**
 * Dessine l'histogramme
 */
const drawBars = () => {
    x = scaleBand(
        data.map(d => d.year),
        [padding[3], width - padding[1]]
    )
        .paddingInner(0.2)
        .paddingOuter(0.2)
    const y = scaleLinear(extent(data, d => d.population), yRange()).nice()

    $populationLabel
    .transition()
        .duration(transitionDuration)
        .attr('x', x.range()[0] + 10)
        .attr('y', y.range()[1])

    // Draw axis
    $bottomAxis
        .transition()
        .duration(transitionDuration)
        .attr('transform', `translate(0, ${y.range()[0]})`)
        .call(
            axisBottom(x)
                .tickValues(data.map(d => d.year).filter((y, k) => k % 2 === 0))
                .tickFormat(v => v.toString())
        )
    $leftAxis
        .transition()
        .duration(transitionDuration)
        .attr('transform', `translate(${x.range()[0]}, 0)`)
        .call(
            axisLeft(y)
                .tickFormat(v => v.toString().slice(0, -6) + 'M')
        )


    $svg.selectAll('.bar')
        .data(data)
        .join(
            enter => enter.append('rect').attr('class', 'bar')
        )
        .transition()
        .duration(transitionDuration)
        .attr('x', d => x(d.year))
        .attr('y', d => y(d.population))
        .attr('width', x.bandwidth)
        .attr('height', d => y.range()[0] - y(d.population))
}

const yRange = () => [height - padding[2], padding[0]]


csv('data.csv')
    .then(r => r.map(row => {
        return Object.fromEntries(Object.entries(row).map(([k, v]) => {
            return [
                k,
                parseInt(v.replaceAll(/\D/g, ''), 10)
            ]
        }))
    }))
    .then(r => {
    data = r
    drawBars()
    drawLine()
    transitionDuration = 700
    input.addEventListener('change', drawLine)
    window.addEventListener('resize', debounce(() => {
        width = window.innerWidth
        height = window.innerHeight - 50
        $svg
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
        drawBars();
        drawLine();
    }, 500))

    document.body.appendChild($svg.node())
})

