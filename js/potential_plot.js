// Scatter plot for TOC vs S1+S2 parameters
// Lower left in reference image

class PotentialPlot{
    mouseOverHandler(d, i){
        let id = d.SRCLocationID+"potTip";
        //let samplesInBasin = geospatialData.filter(e=>e.USGS_Province === name);

        d3.select("#potentialPlot")
            .append("div")
            .attr("class", "plotHover")
            .style("left", d3.event.pageX + 15+"px")
            .style("top", d3.event.pageY+ 15+"px")
            .style("background-color", d3.rgb(255,255,255,0.8))
            .attr("id", id)
            .html(() => { 
                return "<h6>" + d.SRCLocationID + "</h6>"
                    + "<text style='text-align: left;'>TOC%: "+ d.TOC_Percent_Measured+"</text>"
                    + "<br>"
                    + "<text style='text-align: left;'>S1 + S2: "+ d.S1S2__mgHC_gmrock+"</text>"; });
    }

    mouseOutHandler(d, i) {
        let id = d.SRCLocationID+"potTip";
        d3.select("#"+id).remove();
    }
    constructor(defaultData, defaultFormation, wellDetails){
        this.defaultData = defaultData;
        this.defaultFormation = defaultFormation;
        this.wellDetails = wellDetails;

        this.margin = {top: 30, right: 30, bottom: 30, left: 30};
        this.width = document.documentElement.clientWidth* 0.30;
        this.height = document.documentElement.clientHeight * 0.45;

        this.svg = d3.select("#potentialPlot")
                     .append("svg")
                     .attr("id", "potentialPlotSVG")
                     .attr("class", "plot");
                     
        // Plot title
        this.svg.append("text")
            .attr("x", this.width/3)
            .attr("y", this.margin.top)
            .text("Potential Generation");

        //filter out data that lacks sum of S1 + S2 && TOC
        let samplesWithInformation = defaultData.filter(d => {if (d.S1__mgHC_gmrock_ !== '' && d.S2__mgHC_gmrock_ !== '' && d.TOC_Percent_Measured !== '') return d});    
        samplesWithInformation = this.calcAndAppendS1S2Sum(samplesWithInformation);

        // X and Y scales 
        this.x = d3.scaleLinear()
                .domain([100, 0])
                .range([this.width - this.margin.right, this.margin.left*2]);
        this.y = d3.scaleLinear()
                .domain([0,1000])
                .range([this.height - this.margin.bottom*2, this.margin.top *2]);

        //y gridlines
        this.svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate("+ this.margin.right *2+ "," + 0 + ") scale(0.79,1)")
            .call(d3.axisLeft(this.y)
                .tickSize(-this.width, 0, 0)
                .tickFormat("")
            );
            
        // X-axis
        this.svg.append("g")
            .attr("id", "potentialPlotX")
            .attr("transform", "translate(0," + parseInt(this.height - this.margin.bottom*2) + ")")
            .call(d3.axisBottom(this.x));
      
        // Y Axis
        this.svg.append("g")
            .attr("id", "potentialPlotY")
            .attr("transform", "translate("+ this.margin.right * 2 + "," + 0 + ")")
            .call(d3.axisLeft(this.y));

        
        // Axis labels
        // x
        this.svg.append("text")
            .attr("x", this.width/2.25)
            .attr("y", parseInt(this.height - this.margin.bottom))
            .text("TOC%");
        // y
        this.svg.append('text')
            .attr('x', -(this.height / 2))
            .attr('y', this.width / 20)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text('S1 + S2')

        
        // Scatterplot circles 
        this.svg.selectAll("circle")
            .data(samplesWithInformation)
            .enter().append("circle")
            .attr("id", (d)=>{return d.SRCLocationID})
            .attr("cx", (d) => { return this.x(d.TOC_Percent_Measured); })
            .attr("cy", (d) => { return this.y(d.S1S2__mgHC_gmrock); })
            .attr("fill", (d) => {
                let color;
                this.wellDetails.forEach( well => {
                    if(d.SRCLocationID === well.wellID){
                        color = well.color;
                    }})
                return color;})
            .attr("stroke", "gray")
            .attr("r", 5)
            .style("opacity", 1)
            .on("mouseover", this.mouseOverHandler)
            .on("mouseout", this.mouseOutHandler);

        //appending delimiters

        let that = this;
        function _scalePoints(curve){

            let curvex = curve.map((d) => {
                return [that.x(d[0]),that.y(d[1])];});
            return curvex;
        }

        let lineGenerator = d3.line()
        ;
        //data

        let curve1 = [[0.1, 1.5],
            [100, 1.5]];

        let curve2 =[[1, 1000],
            [1, 3.5],
            [100, 3.5]];

        let curve3 = [[2, 1000],
            [2, 10],
            [100, 10]];

        let curve4 = [[3, 1000],
            [3, 20],
            [100, 20]];

        curve1 = _scalePoints(curve1);
        curve2 = _scalePoints(curve2);
        curve3 = _scalePoints(curve3);
        curve4 = _scalePoints(curve4);
        //generate line
        let path1 = lineGenerator(curve1);
        let path2 = lineGenerator(curve2);
        let path3 = lineGenerator(curve3);
        let path4 = lineGenerator(curve4);


        this.svg.selectAll('.delimiter').remove();

        let paths = [path1, path2, path3, path4];

        for(let i=0; i < paths.length; i++){

            this.svg.append('path')
                .attr('class','delimiter')
                .attr('d', paths[i])
                .style('fill','none')
                .style('stroke','darkred')
                .style('opacity',0.5)
                .style('stroke-width','2px');

        }



    }


    minmax(samples, tag){
        
        if(samples.length > 0){
            let min = parseFloat(samples[0][tag]);
            let max = parseFloat(samples[0][tag]);
            for(let i = 0; i < samples.length; i++){
                let currentValue = parseFloat(samples[i][tag]);
                if(currentValue < min){
                    min = currentValue;
                }
                if(currentValue > max){
                    max = currentValue;
                }
            }
            return [min, max];
        }
        else{
            return[0,10];
        }
    }
    calcAndAppendS1S2Sum(sampleList){
        for(let i = 0; i < sampleList.length; i++){
            let sumS1S2 = parseFloat(sampleList[i]['S1__mgHC_gmrock_']) + parseFloat(sampleList[i]['S2__mgHC_gmrock_']);
            sampleList[i]["S1S2__mgHC_gmrock"] = sumS1S2;
        }
        return sampleList;
    }
    update(samples,wellDetails){

        //filter out data that lacks sum of S1 + S2 && TOC
        let samplesWithInformation = samples.filter(d => {if (d.S1__mgHC_gmrock_ !== '' && d.S2__mgHC_gmrock_ !== '' && d.TOC_Percent_Measured !== '') return d});
        samplesWithInformation = this.calcAndAppendS1S2Sum(samplesWithInformation);

        let c = this.svg.selectAll("circle").data(samplesWithInformation);
        c.exit().remove();
        let newc = c.enter().append('circle');
        c = newc.merge(c);

        this.svg.selectAll("circle")
            .transition()
            .duration(1000)
            .attr("id", (d)=>{return d.SRCLocationID})
            .attr("fill", (d) => {
                let color;
                this.wellDetails.forEach( well => {
                    if(d.SRCLocationID === well.wellID){
                        color = well.color;
                    }})
                return color;})
            .attr("cx", (d) => { return this.x(d.TOC_Percent_Measured); })
            .attr("cy", (d) => { return this.y(d.S1S2__mgHC_gmrock); })
            .on("end", function() {
                d3.select(this)
                .attr("id", (d)=>{return d.SRCLocationID})
                .attr("fill", (d,i) => {
                    let color;
                    wellDetails.forEach( well => {
                        if(d.SRCLocationID === well.wellID){
                            color = well.color;
                        }})
                    return color;
                });
            });
        this.svg.selectAll("circle").attr("stroke", "gray").attr("r",5).style("opacity", 1);


        //appending delimiters

        let that = this;
        function _scalePoints(curve){

            let curvex = curve.map((d) => {
                return [that.x(d[0]),that.y(d[1])];});
            return curvex;
        }

        let lineGenerator = d3.line()
            ;
        //data

        let curve1 = [[0.1, 1.5],
            [100, 1.5]];

        let curve2 =[[1, 1000],
            [1, 3.5],
            [100, 3.5]];

        let curve3 = [[2, 1000],
            [2, 10],
            [100, 10]];

        let curve4 = [[3, 1000],
            [3, 20],
            [100, 20]];

        curve1 = _scalePoints(curve1);
        curve2 = _scalePoints(curve2);
        curve3 = _scalePoints(curve3);
        curve4 = _scalePoints(curve4);
        //generate line
        let path1 = lineGenerator(curve1);
        let path2 = lineGenerator(curve2);
        let path3 = lineGenerator(curve3);
        let path4 = lineGenerator(curve4);


        this.svg.selectAll('.delimiter').remove();

        let paths = [path1, path2, path3, path4];

        for(let i=0; i < paths.length; i++){

            this.svg.append('path')
                .attr('class','delimiter')
                .attr('d', paths[i])
                .style('fill','none')
                .style('stroke','darkred')
                .style('opacity',0.5)
                .style('stroke-width','2px');

        }









    }
    updateWells(selectedWells){
        this.svg.selectAll("circle")
                .style("opacity", 0.25)
                .attr("stroke", "white")
                .on("mouseover", null)
                .on("mouseout", null);
        selectedWells.forEach(id => {
            this.svg.selectAll("#"+id).raise(); //brings the selected elements to the top
            this.svg.selectAll("#"+id)
                    .style("opacity", 1)
                    .attr("stroke", "black")
                    .on("mouseover", this.mouseOverHandler)
                    .on("mouseout", this.mouseOutHandler);
        });
    }
}