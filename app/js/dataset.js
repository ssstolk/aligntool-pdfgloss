// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright © 2018-2022 Sander Stolk

const EOL = "\r\n";

const NS_TOE = "http://oldenglishthesaurus.arts.gla.ac.uk/";

function toRDF(json, targetNamespace="http://www.example.com/", targetOntology, defaultAnnotation="") {
    if (!json)
        return "";
    
    var turtleHeader = getTurtleHeader(targetNamespace);
    var turtleBodyOntology = getTurtleOntology(targetOntology);
    var turtleBodyAnnotations = getTurtleTitle("ANNOTATIONS");
    
    var labels = new Array();
    var lexicalConcepts = new Array();
    var lexicalEntries = new Array();
    var lexicalSenses = new Array();
    
    addLabels(defaultAnnotation, labels);
    
    const keys = Object.keys(json);
    if (keys) {
        for (const key of keys) {
            const tableData = json[key];
            for (const rowData of tableData) {
                var entry = rowData.entry;
                var lemma = rowData.lemma;
                var pos = rowData.pos;
                var matches = rowData.match;
                var annotation = rowData.annotation;
                
                if (matches && matches.length > 0) {
                    for (const match of matches) {
                        turtleBodyAnnotations += getTurtleMatch(match, entry, annotation, defaultAnnotation, targetOntology);    
                    }
                } else {
                    if (annotation && annotation.indexOf("@") !== -1) {
                        // store lexical entry
                        const newLexicalEntry = {"iri": createEntryIRI(entry), "lemma": alignLemmaWithTOE(lemma), "pos": pos};
                        lexicalEntries.push(newLexicalEntry);
                        turtleBodyAnnotations += getTurtleMatch(newLexicalEntry.iri, entry, annotation, defaultAnnotation, targetOntology);
                        // store lexical senses at indicated categories (which are preceded by @)
                        const categoryMatches = [...annotation.matchAll(/@([^\s>]*)(>"(.*)")?/gm)];
                        for (let i=0; i<categoryMatches.length; i++) {
                            const categoryMatch = categoryMatches[i];
                            let category = categoryMatch[1];
                            if (categoryMatch.length > 2 && categoryMatch[3]) {
								const label = categoryMatch[3];
                                const newConcept = {"iri": createConceptIRI(entry, label), "label": label, "broader": categoryMatch[1]};
                                lexicalConcepts.push(newConcept);
                                category = newConcept.iri;
                            }
                            lexicalSenses.push({"iri": createSenseIRI(entry, i), "entry": newLexicalEntry, "category": category});
                        }
                    }
                }
                addLabels(annotation, labels);
            }
        }
    }
    var turtleBodyLabels   = getTurtleLabels(labels, targetOntology);
    var turtleBodyConcepts = getTurtleConcepts(lexicalConcepts, targetOntology);
    var turtleBodyEntries  = getTurtleEntries(lexicalEntries, targetOntology);
    var turtleBodySenses   = getTurtleSenses(lexicalSenses, targetOntology);
    
    return turtleHeader + 
        turtleBodyOntology + 
        turtleBodyLabels + 
        turtleBodyConcepts + 
        turtleBodyEntries + 
        turtleBodySenses + 
        turtleBodyAnnotations;
}

function getTurtleHeader(targetNamespace) {
    return "" +
        "@base            <" + targetNamespace + "> ." + EOL +
        "@prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ." + EOL +
        "@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> ." + EOL +
        "@prefix owl:     <http://www.w3.org/2002/07/owl#> ." + EOL +
        "@prefix skos:    <http://www.w3.org/2004/02/skos/core#> ." + EOL +
        "@prefix ontolex: <http://www.w3.org/ns/lemon/ontolex#> ." + EOL +
        "@prefix oa:      <http://www.w3.org/ns/oa#> ." + EOL +
        "@prefix toe:     <"+ NS_TOE + "> ." + EOL +
        EOL;
}

function getTurtleOntology(ontologyIRI) {
    return getTurtleTitle("ONTOLOGY") +
        "<" + ontologyIRI + "> a owl:Ontology ." + EOL +
        EOL;
}

function getTurtleTitle(title) {
    const len = title.length;
    return "" +
        createString('#', 3+len+3) + EOL +
        createString('#', 2) + " " + title + " " + createString("#", 2) + EOL +
        createString('#', 3+len+3) + EOL +
        EOL;
}

function createString(character, count) {
    var result = "";
    for (var i=0; i<count; i++) {
        result += character;
    }
    return result;
}

function getTurtleMatch(match, entry, annotation="", defaultAnnotation="", ontologyIRI) {
    const iriAnnotation = createAnnotationIRI(entry);
    const iriBody = iriAnnotation + "-body";
    const iriTarget = getIRIofMatch(match);
	const text = annotation + ((annotation.length > 0) ? " ":"") + defaultAnnotation;
    
    if (iriTarget == null)
        return "";
    
    var labels = new Array();
    addLabels(annotation, labels);
    addLabels(defaultAnnotation, labels);
    
    var result = 
        "<"+iriAnnotation+"> a oa:Annotation ;" + EOL +
        (ontologyIRI ? ("    rdfs:isDefinedBy <"+ontologyIRI+"> ;" + EOL) : "") +
        "    oa:hasTarget <"+iriTarget+"> ;" + EOL +
        "    oa:motivation oa:commenting ;" + EOL;
	result += "    oa:bodyValue \"\"\""+text+"\"\"\" ;" + EOL;
    
    if (labels.length == 0)
        result += "." + EOL;
    else {
        result += "    oa:hasBody <"+iriBody+"> ." + EOL +
                  "<"+iriBody+"> a oa:SpecificResource ;" + EOL +
                  (ontologyIRI ? ("    rdfs:isDefinedBy <"+ontologyIRI+"> ;" + EOL) : "") +
                  "    oa:purpose oa:tagging ;" + EOL;

        for (const label of labels) {
            const iriLabel = createLabelIRI(label);
            result +=
            "    oa:hasSource <"+iriLabel+"> ;" + EOL;
        }
    }
    
    result += "." + EOL + EOL;
    return result;
}

function createAnnotationIRI(entry) {
    // assuming base namespace
    return "id/annotation/" + cyrb53(entry);
}

function createLabelIRI(label) {
    // assuming base namespace
    return "id/concept/" + label;
}

function createConceptIRI(entry, label) {
    // assuming base namespace
    return "id/concept/" + cyrb53(entry + "-" + label);
}

function createEntryIRI(entry) {
    // assuming base namespace
    return "id/entry/" + cyrb53(entry);
}

function createSenseIRI(entry, number) {
    // assuming base namespace
    return "id/sense/" + cyrb53(entry) + "-s" + (number+1);
}

function getIRIofMatch(match) {
    return (match && match["text/uri-list"]) ? match["text/uri-list"] : null;
// alternatively, extracting from text/html:
//    var text = match["text/html"];
//    var patt = /itemid=["']([^"']*)["']/mi;
//    var hit = patt.exec(text);
//    return (hit && hit[1]) ? hit[1] : null;
}

function getTurtleLabels(labels, ontologyIRI) {
    if (!labels) {
        return "";
    }
    
    var result = getTurtleTitle("LABELS");    
    for (const label of labels) {
        const iriLabel = createLabelIRI(label);
        result +=
            "<"+iriLabel+"> a skos:Concept ;" + EOL +
            (ontologyIRI ? ("    rdfs:isDefinedBy <"+ontologyIRI+"> ;" + EOL) : "") +
            "    skos:prefLabel \"\"\""+label+"\"\"\" ." + EOL +
            EOL ;
    }
    return result;
}

// TODO: should return labels sorted (!)
function addLabels(annotation, labels) {
    const labelsFound = getLabels(annotation);
    if (labelsFound) {
        for (const labelFound of labelsFound) {
            if (!labels.includes(labelFound)) {
                labels.push(labelFound);
            }
        }
    }
}

function getLabels(annotation) {
    var labelsFound = new Array();
    
    // note: official library for parsing tweets from Twiter can be found here:
    //       https://github.com/twitter/twitter-text
    
    if (annotation) {
        var patt = /(?:^|[^\/\B])#(?![0-9_]+\b)([a-zA-Z0-9_]{1,30})(?:\b|\r)/g
        var hits = annotation.match(patt);
        if (hits) {
            for (const hit of hits) {
                labelsFound.push(hit.substring(hit.indexOf("#")+1)); // without preceding '#'
            }
        }
    }
    
    return labelsFound;
}

function getTurtleConcepts(concepts, ontologyIRI) {
    if (!concepts || concepts.length == 0) {
        return "";
    }
    
    var result = getTurtleTitle("LEXICAL CONCEPTS");    
    for (const concept of concepts) {
        result +=
            "<"+concept.iri+"> a ontolex:LexicalConcept ;" + EOL +
            (ontologyIRI ? ("    rdfs:isDefinedBy <"+ontologyIRI+"> ;" + EOL) : "") +
            "    skos:prefLabel \"\"\""+concept.label+"\"\"\"@en ;" + EOL +
            "    skos:broader <"+concept.broader+"> ." + EOL +
            EOL ;
    }
    
    return result;
}

function getTurtleEntries(entries, ontologyIRI) {
    if (!entries || entries.length == 0) {
        return "";
    }
    
    var result = getTurtleTitle("LEXICAL ENTRIES");    
    for (const entry of entries) {
        const posIri = NS_TOE + "pos/#" + alignPosWithTOE(entry.pos);
        result +=
            "<"+entry.iri+"> a ontolex:LexicalEntry ;" + EOL +
            (ontologyIRI ? ("    rdfs:isDefinedBy <"+ontologyIRI+"> ;" + EOL) : "") +
            "    a <"+posIri+"> ;" + EOL +
            "    skos:prefLabel \"\"\""+entry.lemma+"\"\"\"@ang ." + EOL +
            EOL ;
    }
    
    return result;
}

function alignLemmaWithTOE(lemma) { // TODO: Currently specific to Andreas glossary; move to andreas.html
    return lemma ? lemma.replace('-', '') : undefined;
}

function alignPosWithTOE(pos) { // TODO: Currently specific to Andreas glossary; move to andreas.html
    if (pos.startsWith("adj"))  return "aj";
	if (pos.startsWith("adv"))  return "av";
	if (pos.startsWith("conj")) return "cj";
    if (pos.startsWith("prep")) return "p";	
    if (pos.startsWith("interj")) return "in";
    if (pos.startsWith("m.") || pos.startsWith("f.") || pos.startsWith("n.")) return "n";
    if (pos.startsWith("pron")) return "pn";
    if (pos.startsWith("num") || pos.startsWith("ord")) return "n";
    if (pos.startsWith("tr")) return "vt";
    if (pos.startsWith("intr")) return "vi";
    return "v";
}

function getTurtleSenses(senses, ontologyIRI) {
    if (!senses || senses.length == 0) {
        return "";
    }
    
    var result = getTurtleTitle("LEXICAL SENSES");    
    for (const sense of senses) {
        const entry = sense.entry;
        result +=
            "<"+sense.iri+"> a ontolex:LexicalSense ;" + EOL +
            (ontologyIRI ? ("    rdfs:isDefinedBy <"+ontologyIRI+"> ;" + EOL) : "") +
            "    ontolex:isLexicalizedSenseOf <"+sense.category+"> ;" + EOL +
            "    skos:prefLabel \"\"\""+entry.lemma+"\"\"\"@ang ;" + EOL +
            "    ontolex:isSenseOf <"+entry.iri+"> ." + EOL +
            EOL ;
    }
    
    return result;
}

function containsText(annotation) {
    if (!annotation)
        return false;
    
    const labels = getLabels(annotation);
    
    var labelsLength = 0;
    for (label of labels) {
        labelsLength += label.length+1; // incl. preceding #
    }
    var separatorLength = (annotation.match(/[\s\-\r\n,.;+&]/g) || []).length;
    return (labelsLength + separatorLength) < annotation.length;
}

// source: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
const cyrb53 = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ h1>>>16, 2246822507) ^ Math.imul(h2 ^ h2>>>13, 3266489909);
    h2 = Math.imul(h2 ^ h2>>>16, 2246822507) ^ Math.imul(h1 ^ h1>>>13, 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

// works for allegrograph instance
function publishRDF(file, mimeType, store, graph) {
    console.log(file);

    var previousUsername = sessionStorage.getItem('username');
    var username = prompt("Please enter your username", previousUsername!==null ? previousUsername : '');
    var password = prompt("Please enter your password\r\n(Publishing process will afterwards start running in the background.)", "");
    
    if (!username || !password) {
        alert("Publication aborted");
        return;
    }
    
    sessionStorage.setItem('username', username);

    fetch(store + '?context=' + encodeURIComponent('<'+graph+'>'), {
        method: 'PUT',
        headers: {
            'Content-Type': mimeType + '; charset=utf-8',
            'Authorization': 'Basic ' + btoa(username + ":" + password)
        },
        body: file
    }).then (
        response => response.json()
    ).then (
        success => alert("Publication was successful")
    ).catch (
        error => alert("Publication failed")
    );
}
