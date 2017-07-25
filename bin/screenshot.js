#! /usr/bin/env phantomjs

// PDF ou JPG ont une qualité inférieure
var args = require('system').args,
    url = args[1],
    dest = args[2] || 'screenshot.png',
    scale = eval(args[3]) || 1,
    secs = 1;

if (!url) {
    console.log(usage());
    phantom.exit();
}

var page = require('webpage').create();

// donner une hauteur importante pour forcer lazyload
// page.viewportSize = { width: 1024, height: 2768 };

console.log('loading ' + url);
page.open(url,
    function () {

        // scale the page 
        // http://zecipriano.com/2014/10/screenshots-size-phantomjs/
        page.evaluate(function (scale) {
            // the scale of the content, 1 for normal, 2 for a kind of retina
            document.body.style.webkitTransform = "scale(" + scale + ")";
            document.body.style.webkitTransformOrigin = "0% 0%";
            document.body.style.width = 100 / scale + "%";

        }, scale);


        // attendre 1seconde pour d3.legend()
        console.log('sleeping for ' + secs + 's');
        setTimeout(function () {
            var a = page.evaluate(function() {
              return document.all[0].outerHTML.match(/<svg[^]*?<\/svg>/gm)[0];
            });

            // match all SVGs and save them
            var i = 0;
            var u = a.replace(/<svg[^]*?<\/svg>/gm, function(svg) {

                // plantage sur les textures !
                svg = svg
                .replace(/(fill: )(#.....)( rgba\(.*?\))?;/g, '$1 url($2);')
                .replace(/&nbsp;/g, ' ');
                saveas('<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + svg, dest + (i>0 ? i : '') + '.svg');
                i++;
            });

/*
            // evacuer un bug sur stroke-dasharray
            page.evaluate(function() {
                (typeof d3 != 'undefined') && d3.selectAll('.fixdasharray')
                .each(function(d) {
                    var me = d3.select(this);
                    if (me.attr('stroke-width') && +me.attr('stroke-width') < 1) {
                        me.attr({
                            opacity: +me.attr('stroke-width'),
                            'stroke-width': 1,
                        });
                    }
                });
            });
*/

            // precisions des valeurs : 1 seul chiffre après la virgule
            a = a.replace(/([0-9]\.[0-9])[0-9]+/g, '$1');
            saveas('<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + a, 'screenshot.svg');
            
            console.log('saving ' + url + ' at scale ' + scale + ' as ' + dest);
            page.render(dest);
            page.render(dest+'.png');
            phantom.exit();

        }, secs * 1000);

    });


function saveas(content, path) {
    var fs = require('fs');
    fs.write(path, content, 'w');
}

function usage() {
    return args[0] + '[url] [dest.png]';
}

