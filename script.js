function simulate() {

    document.getElementById('sim-button').disabled = true;

    for (var p = 0; p < GRAPH_COUNT; p++) {
        var placeholder = graphPlaceholders[p];
        var ctx = placeholder.getContext('2d');
        ctx.font = '40px Georgia';
        ctx.fillStyle = SQUARE_COLOR;
        ctx.fillText('Graphing...', CANV_DIM * 0.35, CANV_DIM * 0.5);
    }

    clearGrid();
    pickFirstInfection();
    updateInfections();
    gameCycle();
}


function gameCycle() {

    var peopleInfectedInEpoch = 0;
    var peopleCapableOfInfecting = new Set(peopleThatCanInfect);

    for (var i = 0; i < peopleCapableOfInfecting.size; i++) {
        var personInfecting = Array.from(peopleCapableOfInfecting)[i];
        var peopleBeingInfected = getRandomInfections();

        for (var j = 0; j < peopleBeingInfected; j++) {
            var personCoords = getRandomInfected(personInfecting);
            var distApplies = socialDistApplies(personInfecting, personCoords);
            var distWorks = chanceOfEvent(socialDistEfficiency);
            var socialDistancingWorks = distApplies && distWorks;
            
            if (!socialDistancingWorks && infectablePeople.has(personCoords)) {
                infectedPeople.add(personCoords);
                peopleThatCanInfect.add(personCoords);
                infectablePeople.delete(personCoords);
                fillBox(personCoords);
                updateInfections();
                peopleInfectedInEpoch += 1;
            }
        }

        peopleThatCanInfect.delete(personInfecting);
    }

    peopleInfected += peopleInfectedInEpoch;
    newInfectionsByEpoch.push(peopleInfectedInEpoch);
    totalInfectedByEpoch.push(peopleInfected);
    updateInfections();

    if (peopleThatCanInfect.size == 0) {
        prepareGraphValues();

        return;

    } else {
        setTimeout(function() {gameCycle();}, 750);
    }
}


function prepareGraphValues() {

    var epochList = [];

    for (var i = 1; i < totalInfectedByEpoch.length + 1; i++) {
        epochList.push(i);
    }

    var xValLists = [
        epochList, 
        epochList
    ];

    var yValLists = [
        totalInfectedByEpoch, 
        newInfectionsByEpoch
    ];

    var xLabels = [
        'Epoch', 
        'Epoch'
    ];

    var yLabels = [
        'People Infected', 
        'New People Infected'
    ];

    var titles = [
        'Total People Infected By Epoch', 
        'New People Infected By Epoch'
    ];

    setUpGraphs(xValLists, yValLists, xLabels, yLabels, titles);
}


function pickFirstInfection() {

    var randX = getRandomNumber(0, popSqRoot);
    var randY = getRandomNumber(0, popSqRoot);
    var coord = turnIntoCoord(randX, randY);

    infectedPeople.add(coord);
    peopleThatCanInfect.add(coord);
    infectablePeople.delete(coord);
    peopleInfected += 1;
    newInfectionsByEpoch.push(1);
    totalInfectedByEpoch.push(1);
    fillBox(coord);
}


function socialDistApplies(infectingPerson, infectedPerson) {

    var horizontal_distance = Math.abs(
        getCoordX(infectingPerson) - getCoordX(infectedPerson)
    );

    var vertical_distance = Math.abs(
        getCoordY(infectingPerson) - getCoordY(infectedPerson)
    );

    return horizontal_distance > 2 || vertical_distance > 2;
}


function getCoordX(coord) {

    return Number(coord.split(',')[0]);
}


function getCoordY(coord) {

    return Number(coord.split(',')[1]);
}


function turnIntoCoord(coordX, coordY) {

    return coordX.toString() + ',' + coordY.toString();
}


function chanceOfEvent(prob) {

    return Math.random() < prob;
}


function getRandomInfections() {

    return Math.round(getRandomValue(avgInfectionsLambda));
}

function getRandomInfected(infectiousPerson) {

    var coordX = getCoordX(infectiousPerson) + Math.ceil(
        getRandomValue(infectionRangeLambda, negatives=true)
    );

    var coordY = getCoordY(infectiousPerson) + Math.ceil(
        getRandomValue(infectionRangeLambda, negatives=true)
    );

    coordX = (coordX + popSqRoot) % popSqRoot;
    coordY = (coordY + popSqRoot) % popSqRoot;

    return turnIntoCoord(coordX, coordY);
}


function fiftyFifty() {

    return Math.random() >= 0.5;
}


function getRandomValue(averageValueRec, negatives=false) {

    var float = Math.random();

    while (float > maxFloat) {
        float = Math.random();
    }

    if (negatives && fiftyFifty()) {

        return -getValue(float, averageValueRec);

    } else {

        return getValue(float, averageValueRec);
    }
}


function getValue(randFloat, avgValRec) {

    return -Math.log(1 - randFloat) / avgValRec;
}


function getFloat(value) {

    return 1 - Math.pow(Math.E, -infectionRangeLambda * value);
}


function getRandomNumber(min, max) {

    return Math.floor(Math.random() * (max - min) + min);
}


function updateInfections() {

    var new_infection_str = [

        "Total People Infected: ", 
        peopleInfected.toString(), 
        ' / ',
        totalPeople.toString()

    ].join('');

    document.getElementById('total-infections').innerHTML = new_infection_str
}

function setUpGraphs(
        chartXValLists, 
        chartYValLists, 
        chartXLabels, 
        chartYLabels, 
        chartTitles 
        ) {

    for (var i = 0; i < GRAPH_COUNT; i++) {
        var graphNum = i + 1;
        var node = document.getElementById('node' + graphNum.toString());
        var graphPlaceholder = graphPlaceholders[i];

        var newText = [

            "<div id='graph", 
            graphNum.toString(), 
            "-div'><canvas id='graph",
            graphNum.toString(), 
            "' width='", 
            GRAPH_DIM.toString(),
            "' height='", 
            graphNum.toString(), 
            "'></canvas></div>"

        ].join('');

        node.innerHTML = newText;
        graphPlaceholder.parentNode.removeChild(graphPlaceholder);

        var canv = document.getElementById('graph' + graphNum.toString());
        var ctx = canv.getContext('2d');

        ctx.width = GRAPH_DIM;
        ctx.height = GRAPH_DIM;

        createChart(
            ctx, 
            chartXValLists[i], 
            chartYValLists[i],
            chartXLabels[i], 
            chartYLabels[i], 
            chartTitles[i]
        );
    }
}

function createChart(context, xVals, yVals, xLabel, yLabel, titleLabel) {

    var chart = new Chart(context, {

        type: 'line',
        data: {
            labels: xVals,
            datasets: [{
                label: titleLabel,
                backgroundColor: 'red',
                borderColor: 'black',
                data: yVals
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: yLabel,
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: xLabel
                    }
                }]
            }
        }
    });
}


function fillBox(gridCoords) {

    canvCTX.beginPath();
    canvCTX.fillStyle = SQUARE_COLOR;

    makeRectFromCoords(gridCoords);
    canvCTX.fill();
}


function outlineBox(gridCoords) {

    canvCTX.beginPath();
    canvCTX.lineWidth = 0.2;
    canvCTX.strokeStyle = SQUARE_COLOR;
    
    makeRectFromCoords(gridCoords);
    canvCTX.stroke();
}


function makeRectFromCoords(gridCoords) {

    var splitCoords = gridCoords.split('.');

    canvCTX.rect(
        gridToCanvas(Number(splitCoords[0])),
        gridToCanvas(Number(splitCoords[1])),
        sqLength, 
        sqLength
    );
}


function gridToCanvas(gridCoord) {

    return (CANV_DIM * gridCoord) / popSqRoot;
}


function canvasToGrid(canvasCoord) {

    return Math.round((popSqRoot * canvasCoord) / CANV_DIM);
}


function drawGrid(canvSideLength, sqSideLength) {

    var coord;

    for (w = 0; w < canvSideLength; w += sqSideLength) {

        for (h = 0; h < canvSideLength; h += sqSideLength) {
            coord = turnIntoCoord(canvasToGrid(w), canvasToGrid(h));
            outlineBox(coord);
            infectablePeople.add(coord);
        }
    }
}


function handler() {
    clearGrid();

    popSqRoot = Number(document.getElementById('pop-size').value);
    avgInfections = Number(document.getElementById('avg-infections').value);
    infectionRange = Number(document.getElementById('infection-range').value);
    socialDistEfficiency = Number(document.getElementById('social-dist').value);

    if (popSqRoot <= POP_SQROOT_LIMIT) {
        sqLength = CANV_DIM / popSqRoot;
        totalPeople = popSqRoot * popSqRoot;
        infectablePeople = new Set();
        avgInfectionsLambda = 1 / avgInfections;
        infectionRangeLambda = 1 / infectionRange;
        drawGrid(CANV_DIM, sqLength);

    } else if (popSqRoot > POP_SQROOT_LIMIT) {
        canvCTX.font = '40px Georgia';

        canvCTX.fillText(
          'The Population Square', 
          CANV_DIM * 0.12, 
          CANV_DIM * 0.5
        );

        canvCTX.fillText(
            'Root Is Too High', 
            CANV_DIM * 0.21, 
            CANV_DIM * 0.6
        );
    }
}


function clearGrid() {

    canvCTX.clearRect(0, 0, canv.width, canv.height);
}


var canv = document.getElementById('draw-space');
var canvCTX = canv.getContext('2d');
canvCTX.font = '40px Georgia';
var popSqRoot = 100;
var CANV_DIM = 500;
var socialDistEfficiency = 0.6;
canv.width = CANV_DIM;
canv.height = CANV_DIM;
var GRAPH_DIM = 500;
var sqLength = CANV_DIM / popSqRoot;
var GRAPH_COUNT = 2;
var avgInfections = 2.3;
var infectionRange = 4;
var infectionRangeLambda = 1 / infectionRange;
var avgInfectionsLambda = 1 / avgInfections;
var e = Math.E;
var maxDistance = popSqRoot;
var maxFloat = getFloat(maxDistance);
var POP_SQROOT_LIMIT = 1000;
var SQUARE_COLOR = '#0B6623';
var infectedPeople = new Set();
var infectablePeople = new Set();
var peopleThatCanInfect = new Set();
var peopleInfected = 0;
var totalPeople = popSqRoot * popSqRoot;
updateInfections();
var newInfectionsByEpoch = [0];
var totalInfectedByEpoch = [0];
var graphPlaceholders = [];

for (var n = 1; n < GRAPH_COUNT + 1; n++) {
    graphPlaceholders.push(
        document.getElementById('graph-placeholder' + n.toString()));
}

drawGrid(CANV_DIM, sqLength);
