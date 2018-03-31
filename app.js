const height = 800;
const padding = 60;
const width = (window.innerWidth || document.body.clientWidth) - 4*padding;

const awardList = ['ACTOR IN A LEADING ROLE',
    'ACTOR IN A SUPPORTING ROLE',
    'ACTRESS IN A LEADING ROLE',
    'ACTRESS IN A SUPPORTING ROLE',
    'ANIMATED FEATURE FILM',
    'ART DIRECTION',
    'BEST PICTURE',
    'CINEMATOGRAPHY',
    'COSTUME DESIGN',
    'DIRECTING',
    'DOCUMENTARY (Feature)',
    'DOCUMENTARY (Short Subject)',
    'FILM EDITING',
    'FOREIGN LANGUAGE FILM',
    'MAKEUP',
    'MAKEUP AND HAIRSTYLING',
    'MUSIC (Original Dramatic Score)',
    'MUSIC (Original Musical or Comedy Score)',
    'MUSIC (Original Score)',
    'MUSIC (Original Song)',
    'PRODUCTION DESIGN',
    'SHORT FILM (Animated)',
    'SHORT FILM (Live Action)',
    'SOUND',
    'SOUND EDITING',
    'SOUND EFFECTS EDITING',
    'SOUND MIXING',
    'VISUAL EFFECTS',
    'WRITING (Adapted Screenplay)',
    'WRITING (Original Screenplay)'];
const actorAwards = ['ACTOR IN A LEADING ROLE', 'ACTOR IN A SUPPORTING ROLE', 'ACTRESS IN A LEADING ROLE', 'ACTRESS IN A SUPPORTING ROLE',]


//SETUP
const svg = d3.select("svg")
    .attr("width", width + padding)
    .attr("height", height + 2*padding)
    .classed("svgClass", true);

const tooltip = d3.select("body")
    .append("div")
    .classed("tooltip", true);

//DATA DELIVERED
d3.queue()
    .defer(d3.json, './data.json')
    .await(function (err, movieData) {
        //SETUP
        const awardsData = getAwardsData(awardList, movieData);

        const yScale = d3.scaleLinear();
        const xScale = d3.scaleLinear();
        const xScaleBand = d3.scaleBand();

        const xAxis = d3.axisBottom()
            .tickSize(-height + 2* padding)
            .tickSizeOuter(0)
            //.attr("display", "none");
        const yAxis = d3.axisLeft()
            .tickSize(-width + 2* padding)
            .tickSizeOuter(0)
            //.attr("display", "none");

        svg.append("g")
            .attr("class", "xAxis axis")
            .attr("transform", "translate("+ padding + "," + (height - padding) + ")")
            .attr("display", "none");

        svg.append("g")
            .attr("class", "yAxis axis")
            .attr("transform", "translate(" + 2*padding + ",0)")
            .attr("display", "none");

        const linkGroup = svg.append("g")
            .classed("links", true);

        const movieGroup = svg.append("g")
                    .classed("allMovies", true);

        d3.select("#switch")
            .on("click", function () {
                if (d3.event.target.checked) {
                    d3.select(".switchLabel")
                        .text("Show All Nominations");
                    graphAll(false);
                } else {
                    d3.select(".switchLabel")
                        .text("Show Only Winners");
                    graphAll(true);
                }
            });

        d3.select("#back")
            .on("click", function () {          
                if (d3.select("#switch").property("checked")) {
                    //graphAll(movieData.filter(m => m.nominations.filter(n => n.winner === true).length !== 0));
                    graphAll(false);
                } else {
                    //graphAll(movieData);
                    graphAll(true);
                }
            });

        d3.select("#actorToggle")
            .on("click", function () {          
                if (d3.select("#actorToggle").property("checked")) {
                    d3.select(".toggle").classed("marBottom", true);
                    d3.select(".toggleSlider").text("Back to Movies");
                    actorGraph();
                } else {
                    d3.select(".toggle").classed("marBottom", false);
                    d3.select(".toggleSlider").text("Degrees of Nomination");
                    graphAll(!d3.select("#switch").property("checked"));
                }
            });

        svg.append("text").attr("x", padding)
            .attr("y", height/2)
            .attr("transform", "rotate(-90, 40, 500)")
            .attr("dy", "6em")
            .style("text-anchor", "middle")
            .text("IMDB Rating")
            .classed("axisLabel", true)
            .attr("display", "none");

        const xAxisLabel = svg.append("text").attr("x", padding)
            .attr("y", height + padding)
            .attr("transform", "translate(" +(width - padding)/2 + ",0)")
            .style("text-anchor", "middle")
            .classed("axisLabel", true);

        const xAxisExtra = svg.append("text").attr("x", padding)
            .attr("y", height + padding)
            .attr("dy", "1em")
            .attr("transform", "translate(" +(width - padding)/2 + ",0)")
            .style("text-anchor", "middle")
            .classed("axisExtra", true)
            .text("Click a Year for more details")
            .attr("display", "none");


        const simulation = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(-5))
            .force("center", d3.forceCenter(width/2, height/2));
            //.force("link", d3.forceLink().id(d => id))




        //INITIAL ACTIONS
        graphAll(true);




        //GRAPH ALL YEAR AWARDS
        function graphAll(allMovies) {
            simulation.stop();
            d3.select("#back")
                .style("display", "none");
            d3.select(".switchDiv")
                .style("display", "initial");
            d3.select(".axisExtra")
                .style("display", "initial");
            d3.selectAll(".axis, .axisLabel")
                .style("display", "initial");
            d3.select(".links")
                .style("display", "none");
            // xAxis.style("display", "initial");

            xAxisLabel
                .transition().duration(300)
                .attr("dy", "-1em")
                .text("Award Year");



            const updateMovieData = allMovies ? movieData : movieData.filter(m => m.nominations.filter(n => n.winner === true).length !== 0);

            setxScalesAll(d3.extent(updateMovieData, movie => movie.year));
            setyScales(updateMovieData);

            //movieGroup.style("opacity", 0).transition().duration(300).style("opacity", 1);
            //movieGroup.transition().duration(300);

            const movieUpdate = movieGroup.selectAll("circle")
                .data(updateMovieData, movie => movie.name);

            movieUpdate.exit()
                .remove();

            movieUpdate.enter()
                .append("circle")
                    .attr("cx", width/2)
                    .attr("cy", height/2)
                .merge(movieUpdate)
                    .classed("circleClass", true)
                    .on("mousemove touchstart", showTooltip)
                    .on("mouseout touchend", hideTooltip)
                    .classed("yearWinner", false)
                    .transition().duration(500)
                    .attr("r", movie => 8 + 2 * movie.nominations.length)
                    .attr("cx", movie => xScale(movie.year) + padding )
                    .attr("cy", movie => yScale(movie.rating) )


            function setxScalesAll(domainArray) {
                xScale.domain(domainArray)
                    .range([padding, width - padding]);
                xAxis.scale(xScale)
                    .tickFormat(d3.format("d"));
                svg.select(".xAxis")
                    .transition()
                    .duration(300)
                    .call(xAxis.ticks(domainArray[domainArray.length - 1] - domainArray[0]));
                    
                svg.selectAll(".xAxis text")  // select all the text elements for the xaxis
                    .attr("transform", "translate(-8 30) rotate(-90)")
                    .attr("font-size", "1.5em")
                    .classed("yearLabel", true);
    
    
                svg.selectAll(".xAxis .tick")
                    .on("click", (d) => graphSingleYear(d));
            }

            function showTooltip(movie) {
                tooltip.style("opacity", 1)
                    .style("left", d3.event.x + 'px')
                    .style("top", d3.event.y + 'px')
                    .html(() => `   
                        <h3>${movie.name}</h3>
                        <p>Year - ${movie.year}</p>
                        <p>Rating - ${movie.rating}</p>
                        <p>Nominations</p>
                        <ul>${movie.nominations.map(nom => {
                            return nom.winner ?`<li><strong>${nom.award}</strong></li>` : `<li>${nom.award}</li>`;
                        }).join("")}</ul>
                    `
                    )
            }
        }


        //GRAPH SINGLE YEAR
        function graphSingleYear(singleYear) {   
            simulation.stop(); 
            d3.select("#back")
                .style("display", "initial");
            d3.select(".switchDiv")
                .style("display", "none");
            d3.select(".axisExtra")
                .style("display", "none");
            d3.selectAll(".axis, .axisLabel")
                .style("display", "initial");
            d3.select(".links")
                .style("display", "none");

            xAxisLabel.transition().duration(300)
                .attr("dy", "2.2em")
                .text("Awards Given").transition().duration(400);

            const awardsUpdate = awardsData.filter(m => m.year == singleYear);

            xScaleBand.domain(awardList.filter(awardName => awardsUpdate.find((movie) => movie.award === awardName)))
                .range([padding, width -  padding]);
            xAxis.scale(xScaleBand)
                .tickFormat(d => d);
            svg.select(".xAxis")
                .transition()
                .duration(300)
                .call(xAxis);

            // svg.selectAll(".xAxis text")  // select all the text elements for the xaxis
            //     .attr("transform", "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)")
            svg.selectAll(".xAxis text")  // select all the text elements for the xaxis
                .attr("text-anchor", "end")
                .attr("transform", "translate(0, 10) rotate(-45)")
                .attr("font-size", "1.2em");

                    
            setyScales(awardsUpdate);

            const movieUpdate = movieGroup.selectAll("circle")
                .data(awardsUpdate, movie => movie.name);

            movieUpdate.exit()
                .remove();

            movieUpdate.enter()
                .append("circle")
                    .attr("cx", width/2)
                    .attr("cy", height/2)
                .merge(movieUpdate)
                    .classed("circleClass", true)
                    .on("mousemove touchstart", showSingleTooltip)
                    .on("mouseout touchend", hideTooltip)
                    .classed("yearWinner", movie => movie.winner)
                    .transition().duration(300)
                    .attr("r", movie => movie.winner ? 12 : 8)
                    .attr("cx", movie => xScaleBand(movie.award) +padding + xScaleBand.bandwidth()/2)
                    .attr("cy", movie => yScale(movie.rating))
            

            function showSingleTooltip(movie) {
                tooltip.style("opacity", 1)
                    .style("left", d3.event.x + 'px')
                    .style("top", d3.event.y + 'px')
                    .html(() => `   
                        <h3>${movie.name}</h3>
                        <p>Rating - ${movie.rating}</p>
                        <p>Award - ${movie.award + (movie.winner ? " - Winner" : " - Nominated")}</p>
                    `
                    )
            }
        }

        function setyScales(updateMovieData) {
            yScale.domain([
                Math.floor(d3.min(updateMovieData, movie => movie.rating)),
                Math.ceil(d3.max(updateMovieData, movie => movie.rating))
            ])
                .range([height - padding, padding]);

            yAxis.scale(yScale);
            svg.select(".yAxis")
                .transition()
                .duration(300)
                .call(yAxis);

            svg.selectAll(".yAxis text")
                .attr("transform", "translate(-34 0)")
                .attr("font-size", "1.5em");
        }

        function actorGraph() {
            d3.selectAll(".axis, .axisLabel, .axisExtra")
                .style("display", "none");
            d3.select("#back")
                .style("display", "none");
            d3.select(".switchDiv")
                .style("display", "none");
            d3.select(".links")
                .style("display", "initial");

            
            const actorData = awardsData
                .filter(award => actorAwards.includes(award.award))
                .map(award => {
                    return {
                        name : award.recipient,
                        nominations : [{
                            award : award.award,
                            movie : award.name,
                            year : award.year,
                            winner : award.winner
                        }],
                        roles : []
                }});
            const actorUpdate = getUniqueActors(actorData);

            actorUpdate.forEach(function(actor) {
                actor.roles = getActorRoles(actor.name);
            });

            const linkData = makeLinks(actorUpdate);
    
            // const nodeGroup = svg.append("g")
            //     .classed("nodes", true);
            const minRadius = 6;

            simulation.nodes(actorUpdate)
                .force("link", d3.forceLink(linkData)
                                    .distance(d => 50*Math.max(d.source.roles.length, d.target.roles.length))
                                    .id(d => d.name))
                .on("tick", function() {
                    linkGroup.selectAll("line")
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);
                    movieGroup.selectAll("circle")
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y);
                });
            simulation.alpha(1).restart();

            const movieUpdate = movieGroup.selectAll("circle")
                .data(actorUpdate, actor => actor.name);    

            movieUpdate.exit()
                .remove();

            movieUpdate.enter()
                .append("circle")
                    .attr("r", d => minRadius + 4*d.nominations.length)
                    // .attr("cx", width/2)
                    // .attr("cy", height/2)
                .merge(movieUpdate)
                    .classed("circleClass", true)
                    .on("mousemove touchstart", showActorTooltip)
                    .on("mouseout touchend", hideActorTooltip)
                    .call(d3.drag()
                        .on("start", dragStart)
                        .on("drag", drag)
                        .on("end", dragEnd))
                    // .classed("yearWinner", movie => movie.winner)
                    // .transition().duration(300)
                    // .attr("r", movie => movie.winner ? 12 : 8)
                    // .attr("cx", movie => xScaleBand(movie.award) + padding*1.3)
                    // .attr("cy", movie => yScale(movie.rating))

            const linkUpdate = linkGroup.selectAll("line")
                .data(linkData, d => d.source.name + d.target.name);
        
            linkUpdate.exit()
                .remove();
            linkUpdate.enter()
                .append("line")
                .classed("linkLine", true)
                .on("mousemove touchstart", showLinkToolTip)
                .on("mouseout touchend", hideLinkToolTip);
            


            function getUniqueActors(actorData) {
                const uniqueActors = []
                actorData.forEach(function(actor) {
                    let actorIndex = uniqueActors.findIndex((a) => {
                        return a.name === actor.name
                    });
                    if (actorIndex !== -1) {
                        uniqueActors[actorIndex].nominations = uniqueActors[actorIndex].nominations.concat(actor.nominations);
                    } else {
                        uniqueActors.push(actor);
                    }
                });
                return uniqueActors;
            }

            function getActorRoles(actor) {
                const roles = [];
                movieData.forEach(function(movie) {
                    movie.actors.forEach(movieActor => {
                        if (movieActor === actor) roles.push(movie.name);
                    });
                });
                return roles;
            }

            function makeLinks(nodes) {
                const links = []
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        for (let k = 0; k < nodes[i].roles.length; k++) {
                            if (nodes[j].roles.includes(nodes[i].roles[k])) {
                                links.push({
                                    source: nodes[i].name,
                                    target: nodes[j].name
                                });
                                break;
                            }
                        }
                    }
                }
                return links;
            }

            function showActorTooltip(actor) {
                tooltip.style("opacity", 1)
                    .style("left", d3.event.x + 'px')
                    .style("top", d3.event.y + 'px')
                    .html(() => `   
                        <h3>${actor.name}</h3>
                        <p>Nominations</p>
                        <ul>${actor.nominations.map(nom => {
                            if (nom.winner) {
                                return `<li><strong>${nom.award}</strong> - ${nom.movie}</li>`
                            } else {
                                return `<li>${nom.award} - ${nom.movie}</li>`;
                            }

                        }).join("")}</ul>
                        `
                    );
                svg.selectAll(".linkLine").filter(d => d.source === actor || d.target === actor)
                    .style("stroke" , "rgb(199,159,39)")
                    .style("stroke-width" , "3");
            }

            function hideActorTooltip() {
                tooltip.style("opacity", 0);
                svg.selectAll(".linkLine")
                    .style("stroke" , "#777")
                    .style("stroke-width" , "1");
            }

            function showLinkToolTip(data, index) {
                const linkMovies = [];
                data.source.roles.forEach(role => {
                    if (data.target.roles.includes(role)) linkMovies.push(role);
                });
                tooltip.style("opacity", 1)
                    .style("left", d3.event.x + 'px')
                    .style("top", d3.event.y + 'px')
                    .html(() => `   
                        <h3>${data.source.name}</h3>
                        <span>and </span>
                        <h3>${data.target.name}</h3>
                        <p>in</p>
                        <ul>${linkMovies.map(movie => `<li>${movie}</li>`).join("")}</ul>`
                    );

                svg.selectAll(".linkLine").filter(d => d === data)
                    .style("stroke" , "rgb(199,159,39)")
                    .style("stroke-width" , "3");
                
            }

            function hideLinkToolTip() {
                tooltip.style("opacity", 0);
                svg.selectAll(".linkLine")
                    .style("stroke" , "#777")
                    .style("stroke-width" , "1");
            }

            function drag(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }
        
            function dragStart(d) {
                simulation.alphaTarget(0.2).restart();
                d.fx = d3.x;
                d.fy = d3.y;
            }
        
            function dragEnd(d) {
                simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
        }




        function hideTooltip() {
            tooltip.style("opacity", 0);
        }

        function getAwardsData(awards, movies) {
            const awardData = [];
            //Lord have mercy
            awards.forEach(function(award) {
                movies.forEach(function(movie) {
                    movie.nominations.forEach(function(nom) {
                        if (nom.award === award) {
                            awardData.push({
                                award : nom.award,
                                name : movie.name,
                                recipient : nom.recipient,
                                rating : movie.rating,
                                winner : nom.winner,
                                year : movie.year
                            });
                        }
                    });
                });
            });
            return awardData;
        }
});




