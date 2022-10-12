# aligntool-pdfgloss
Alignment tool for PDF glossaries to lexical items in Linguistic Linked Data

## About

The alignment tool offers functionality to link entries in glossaries from PDF 
files to lexical items (dictionary entries or specific senses) made available 
as Linguistic Linked Data. The functionality of this application is described 
on page 337 of [this academic article](https://doi.org/10.1163/18756719-12340235), 
which states:

\[The tool\] was specifically created for connecting data from glossaries of 
Old English texts to the dataset of `A Thesaurus of Old English`, already 
available in Evoke. The tool reads in a glossary of a text edition (in PDF 
format), extracts information on the words that occur in that Old English text 
and presents that information in a table. Each table row offers the user the 
means to search for, match, and link related content (in this case, words) 
from `A Thesaurus of Old English` and to annotate these finds with additional 
remarks or labels. Indeed, search results in Evoke can be dragged and dropped 
in other applications, using the mouse cursor, to create a link. The 
alignment thus created can be exported and/or published in the Linked Data 
format in order to view the results alongside `A Thesaurus of Old English` in 
Evoke.

## Case study

The first use of this tool, which aligned the glossaries found in editions of 
the Old English texts `Beowulf`, `Andreas`, and `The Old English Martyrology` 
to the lexicon captured in `A Thesaurus of Old English`, is described in 
[an academic article](https://doi.org/10.1163/18756719-12340236) by Thijs 
Porck. His research employed the following (digital) editions of the texts
mentioned: 

* Fulk, R. D., R. E. Bjork, and J. D. Niles, eds. `Klaeber’s Beowulf`, 4th edn (Toronto: University of Toronto Press, 2008), pp. 344-463.
* North, R., and M. D. J. Bintley, eds. `Andreas: An Edition`, Exeter Medieval Texts and Studies (Liverpool: Liverpool UP, 2016), pp. 324-369.
* Rauer, C., ed. `The Old English Martyrology: Edition, Translation and Commentary`, Anglo-Saxon Texts 10 (Cambridge: D. S. Brewer, 2013), pp. 321-361.

Each of these text editions contains a glossary that employs a grid on which  
its words (or entries) are presented. The exact positions on the page that 
mark this grid vary between the three text editions. For this reason, the 
alignment tool, as it is made available here, includes a webpage per text. 
Such a webpage includes information that delineates the grid. By dropping in 
the PDF file on the webpage, a user is presented with its content and the 
information extracted from it, ready for creating an alignment. In order to 
use this tool for another text, the coordinates mentioned in these webpages 
should therefore be adjusted to fit the new context. 

## Cite

If you are using or extending this application as part of a scientific publication,
we would appreciate a citation of [this article](https://doi.org/10.1163/18756719-12340235)
(for the technical details) and of [this article](https://doi.org/10.1163/18756719-12340236)
for its first use -- aligning glossaries of Old English texts with the lexicon captured in `A Thesaurus of Old English`.

```bibtex
@article { Evoke,
      author = "Sander Stolk",
      title = "Evoke: Exploring and Extending A Thesaurus of Old English Using a Linked Data Approach",
      journal = "Amsterdamer Beiträge zur älteren Germanistik",
      year = "2021",
      publisher = "Brill",
      address = "Leiden, The Netherlands",
      volume = "81",
      number = "3-4",
      doi = "10.1163/18756719-12340235",
      pages = "318 - 358",
      url = "https://doi.org/10.1163/18756719-12340235"
}
```

```bibtex
@article { Evoke,
      author = "Thijs Porck",
      title = "Onomasiological Profiles of Old English Texts: Analysing the Vocabulary of Beowulf, Andreas and the Old English Martyrology through Linguistic Linked Data",
      journal = "Amsterdamer Beiträge zur älteren Germanistik",
      year = "2021",
      publisher = "Brill",
      address = "Leiden, The Netherlands",
      volume = "81",
      number = "3-4",
      doi = "18756719-12340236",
      pages = "359 - 383",
      url = "https://doi.org/10.1163/18756719-12340236"
}
```

## License
This code is copyrighted by [Sander Stolk](https://orcid.org/0000-0003-2254-6613)
and released under the [GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.txt) license.