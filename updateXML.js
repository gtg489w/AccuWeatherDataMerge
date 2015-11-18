// leverages XML Parsing from: https://github.com/jindw/xmldom

var fs = require('fs');
var parser = require('xmldom').DOMParser;
var serializer = require('xmldom').XMLSerializer;

// read the files

var readData = function(sourceFile, targetFile, callback) {
	fs.readFile(sourceFile, 'utf8', function (err, awdata) {
		if(err) {
			return console.log(err);
		}
		fs.readFile(targetFile, 'utf16le', function(err, udata) {
			if(err) {
				return console.log(err);
			}
			callback(awdata, udata);
		});
	});
};

// processing logic

var mergeXMLData = function(sourceData, targetData, parentTag, tag, matchingid) {
	var source = new parser().parseFromString(sourceData);
	var destination = new parser().parseFromString(targetData);

	var sourceTags = source.documentElement.getElementsByTagName(parentTag)[0].getElementsByTagName(tag);
	var destinationParent = destination.documentElement.getElementsByTagName(parentTag)[0];
	var destinationTags = destinationParent.getElementsByTagName(tag);
	var updatedTags = 0;

	console.log('Copying ' + sourceTags.length + ' ' + parentTag + ' to the target file.');

	// copy over new tag data
	for(var i=0; i<sourceTags.length; i++) {
		var tag = sourceTags[i];
		var tagid = tag.getElementsByTagName(matchingid)[0].textContent;

		// see if we have a tag with the matching ID in the destination
		for(var j=0; j<destinationTags.length; j++) {
			var destinationTag = destinationTags[j];
			// get destination id
			var destinationId = destinationTag.getElementsByTagName(matchingid)[0].textContent;
			if(destinationId == tagid) {
				destinationParent.removeChild(destinationTag);
				updatedTags++;
			}
		}

		// add the new tag to the bottom
		var cp = new serializer().serializeToString(tag);
		destinationParent.appendChild(
			new parser().parseFromString(cp)
		);
	}

	// let's clear values for stuff that wasn't in the source file and has a Tag of "Baltimore"
	var removedValueCount = 0;
	for(var j=0; j<destinationTags.length; j++) {
		var destinationTag = destinationTags[j];
		var found = false;
		for(var i=0; i<sourceTags.length; i++) {
			var sourceTag = sourceTags[i];
			if(destinationTag.getElementsByTagName(matchingid)[0].textContent == sourceTag.getElementsByTagName(matchingid)[0].textContent) {
				found = true;
			}
		}
		if(!found && destinationTag.getElementsByTagName('tag')[0].textContent == 'Baltimore') {
			removedValueCount++;
			destinationTag.getElementsByTagName('value')[0].textContent = '';
		}
	}

	console.log('Found ' + updatedTags + ' existing tag(s) and updated them instead of appending them');
	console.log('Source file did not contain ' + removedValueCount + ' tag(s) so we cleared their values in the destination.');
	return new serializer().serializeToString(destination);
};

// kick off the process

readData('./accuweather.xml', './uservar.xml', function(sourceData, targetData) {
	var result = mergeXMLData(sourceData, targetData, 'variables', 'variable', 'name');
	// write to the target file
	var wstream = fs.createWriteStream('./uservar.xml', {
		encoding: 'utf16le'
	});
	wstream.on('finish', function () {
		console.log('Process complete.');
	});
	wstream.write(result, 'utf16le');
	wstream.end();
});


