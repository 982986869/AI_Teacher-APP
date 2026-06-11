// src/notes/BiologyNotes.js
//
// All 20 chapters populated from Examin8 revision-notes exports.
// Schema matches MathsNotes.js: { intro, sections:[{ title, content, bullets[] }] }

const BiologyNotes = {

  'The Living World': {
    intro: 'Diversity, taxonomy, nomenclature and classification of living organisms.',
    sections: [
      {
        title: 'Diversity in the living world',
        content: 'There is a vast variety of living organisms on Earth, known as biodiversity, with 1.7–1.8 million species identified so far. New species are still being discovered. Each kind of organism is called a species. Organisms are named and described scientifically to avoid confusion from local names, using a global standard system.',
      },
      {
        title: 'Nomenclature',
        content: 'To standardise naming globally, scientific names are assigned using a system called binomial nomenclature, introduced by Linnaeus. Each name includes a genus and a species epithet, e.g., Mangifera indica . These names are in Latin, italicised or underlined, with the genus capitalised and species in lowercase.',
      },
      {
        title: 'Classification',
        content: 'Classification is the grouping of organisms based on observable characteristics to make study easier. Terms like mammals, cats, or wheat refer to such groups. These groups are called taxa.',
      },
      {
        title: 'Taxonomy',
        content: 'Taxonomy is the science of identifying, naming, and classifying organisms. It includes characterisation, identification, classification, and nomenclature. Modern taxonomy considers both internal and external features, cell structure, development, and ecological roles.',
      },
      {
        title: 'Taxonomic categories',
        content: 'Taxonomic categories represent different ranks in the classification hierarchy, such as kingdom, phylum, class, order, family, genus, and species. Each rank is called a taxon and includes organisms sharing common characteristics. Classification requires studying similarities and differences in organisms based on morphology, structure, reproduction, and evolutionary relationships to group them scientifically.',
      },
      {
        title: 'Species',
        content: 'Species is the basic taxonomic unit, comprising organisms with fundamental similarities. They can be distinguished from other species by distinct morphological traits. For example, Mangifera indica, Solanum tuberosum, and Panthera leo are different species. Scientific names consist of a genus followed by a specific epithet, like Homo sapiens for humans.',
      },
      {
        title: 'Genus',
        content: 'Genus is a category that includes closely related species with common features. For example, the genus Solanum includes species like potato and brinjal. Panthera includes lion, tiger, and leopard. It differs from other genera like Felis, which includes domestic cats. A genus shows more similarity than higher taxonomic categories.',
      },
      {
        title: 'Family',
        content: 'Family groups together related genera with fewer similarities than species or genus. In plants, Solanum, Petunia, and Datura belong to the family Solanaceae. Among animals, genera Panthera and Felis are placed in the family Felidae. Families are identified using both vegetative and reproductive traits in plants and structural traits in animals.',
      },
      {
        title: 'Order',
        content: 'Order is a higher taxonomic category that includes one or more related families. Similar characters among families are fewer than those in a genus. For example, plant families Convolvulaceae and Solanaceae are grouped in the order Polymoniales. Felidae and Canidae families are included in the animal order Carnivora.',
      },
      {
        title: 'Class',
        content: 'Class comprises related orders. For example, Primata (monkeys, apes) and Carnivora (cats, dogs) belong to the class Mammalia. This category helps group organisms with broader similarities. Other examples include class Insecta for insects and class Dicotyledonae for dicot plants. Class has fewer common features than orders within it.',
      },
      {
        title: 'Phylum',
        content: 'Phylum includes related classes in animals. For example, Mammalia, Aves, Reptilia, and Amphibia belong to the phylum Chordata due to features like notochord and dorsal hollow nerve cord. In plants, the equivalent category is Division. Phylum groups organisms sharing major structural and developmental traits in a broad way.',
      },
      {
        title: 'Kingdom',
        content: 'Kingdom is the highest taxonomic category. All animals from various phyla are grouped under Kingdom Animalia. All plants from various divisions fall under Kingdom Plantae. As we move up from species to kingdom, the number of shared characteristics decreases, making classification more complex and broader at higher ranks.',
      },
    ],
  },

  'Biological Classification': {
    intro: 'Two- and five-kingdom systems: Monera, Protista, Fungi, viruses and lichens.',
    sections: [
      {
        title: 'Need For Classification',
        content: 'Early classification of organisms was based on their usefulness to humans. Aristotle attempted a scientific approach using morphology. Linnaeus introduced a Two Kingdom classification—Plantae and Animalia—but it failed to distinguish between key traits like prokaryotic vs eukaryotic or unicellular vs multicellular. Modern classification considers cell structure, nutrition, reproduction, and evolutionary relationships.',
      },
      {
        title: 'Limitations Of Two Kingdom Classification',
        content: 'The two kingdom system did not account for fundamental differences like cell type (prokaryotic/eukaryotic), nutrition modes (autotrophic/heterotrophic), or cellular organization. It grouped very different organisms such as fungi and green plants or bacteria and algae, making it inadequate for proper classification as scientific understanding advanced.',
      },
      {
        title: 'Five Kingdom Classification',
        content: 'Proposed by R.H. Whittaker in 1969, the Five Kingdom classification includes Monera, Protista, Fungi, Plantae, and Animalia. It is based on characteristics such as cell structure, body organization, nutrition, reproduction, and phylogeny. This system resolved earlier issues by separating prokaryotes (Monera), unicellular eukaryotes (Protista), and fungi from plants.',
      },
      {
        title: 'Kingdom Monera',
        content: 'Kingdom Monera includes all prokaryotic organisms, mainly bacteria. They are found everywhere including extreme habitats. They reproduce mostly by fission, sometimes form spores, and may exchange DNA. Their cell wall composition, nutrition mode, and habitat vary widely. Mycoplasma are unique Monerans that lack a cell wall and are oxygen-independent.',
      },
      {
        title: 'Archaebacteria',
        content: 'Archaebacteria are ancient bacteria adapted to extreme environments such as salt lakes, hot springs, and marshes. They have unique cell wall structures enabling their survival in harsh conditions. Methanogens, a type of archaebacteria, live in the guts of ruminants and help in methane (biogas) production from animal dung.',
      },
      {
        title: 'Eubacteria',
        content: 'Eubacteria or true bacteria have rigid cell walls and may have flagella. Cyanobacteria are photosynthetic, possess chlorophyll a, and may form nitrogen-fixing heterocysts. Chemosynthetic autotrophs oxidize inorganic compounds to make energy. Heterotrophs include decomposers and beneficial microbes, but also pathogens causing diseases like cholera and typhoid.',
      },
      {
        title: 'Mycoplasma',
        content: 'Mycoplasma are the smallest known living cells and lack a cell wall. They can survive without oxygen and are often pathogenic in both plants and animals. Due to the absence of a rigid cell wall, they are highly pleomorphic and resistant to antibiotics like penicillin that target cell wall synthesis.',
      },
      {
        title: 'Kingdom Fungi',
        content: 'Kingdom Fungi includes heterotrophic organisms with diverse morphology and habitats. Most fungi are filamentous, except yeasts which are unicellular. Fungi have chitinous cell walls and reproduce by vegetative, asexual, and sexual means. They can be saprophytes, parasites, or symbionts. Fungi include edible forms, pathogens, and sources of antibiotics like Penicillium.',
      },
      {
        title: 'Structure and reproduction in fungi',
        content: 'Fungi consist of thread-like hyphae forming mycelium. Hyphae may be coenocytic or septate. They reproduce vegetatively (fragmentation, fission, budding), asexually (spores), and sexually (via plasmogamy, karyogamy, and meiosis). Some fungi show a dikaryotic phase (n + n). Spores are formed inside fruiting bodies and serve in classification.',
      },
      {
        title: 'Phycomycetes',
        content: 'Phycomycetes are found in aquatic or damp habitats. Their mycelium is aseptate and coenocytic. Asexual reproduction occurs via motile zoospores or non-motile aplanospores. Sexual reproduction forms zygospores by isogamy, anisogamy, or oogamy. Common examples are Mucor, Rhizopus, and Albugo.',
      },
      {
        title: 'Ascomycetes',
        content: 'Ascomycetes or sac fungi are mostly multicellular with septate mycelium. Asexual reproduction involves conidia on conidiophores. Sexual reproduction produces ascospores inside asci, which are arranged in fruiting bodies called ascocarps. Examples include Penicillium, Aspergillus, Claviceps, Neurospora, morels, and truffles.',
      },
      {
        title: 'Basidiomycetes',
        content: 'Basidiomycetes include mushrooms, bracket fungi, and puffballs. They lack asexual spores and sex organs, reproducing vegetatively and sexually through dikaryotic mycelium. Basidiospores are produced exogenously on basidia within basidiocarps. Examples include Agaricus (mushroom), Ustilago (smut), and Puccinia (rust fungus).',
      },
      {
        title: 'Deuteromycetes',
        content: 'Deuteromycetes or imperfect fungi reproduce only by asexual conidia. Their mycelium is septate and branched. Many are saprophytes, parasites, or decomposers aiding in mineral cycling. Once their sexual stages are discovered, they are reclassified into Ascomycetes or Basidiomycetes. Examples include Alternaria, Colletotrichum, and Trichoderma.',
      },
      {
        title: 'Kingdom Plantae',
        content: 'Kingdom Plantae consists of eukaryotic, chlorophyll-containing organisms known as plants. Most are autotrophic, but some like Cuscuta, Venus flytrap, and bladderwort are partially heterotrophic. Plant cells have chloroplasts and cellulose cell walls. This kingdom includes algae, bryophytes, pteridophytes, gymnosperms, and angiosperms.',
      },
      {
        title: 'Alternation of generations',
        content: 'Plants exhibit alternation of generations with two phases: diploid sporophyte and haploid gametophyte. These phases alternate in the plant life cycle, and the dominance or independence of each phase varies across plant groups.',
      },
      {
        title: 'Kingdom Animalia',
        content: 'Organisms in Kingdom Animalia are heterotrophic, multicellular, and eukaryotic. Their cells lack cell walls. They depend on plants for food and digest it in an internal cavity. Food is stored as glycogen or fat. They exhibit holozoic nutrition, definite growth, sensory systems, and locomotion. Reproduction is sexual, involving copulation and embryonic development.',
      },
      {
        title: 'Viruses',
        content: 'Viruses are non-cellular, inert outside host cells, and crystallisable. They infect living cells to reproduce and are obligate parasites. They contain either RNA or DNA, never both. The protein coat, capsid, protects the genetic material. Plant viruses mostly have RNA, animal viruses have RNA or DNA. Viruses cause diseases like flu, AIDS, mumps, and smallpox.',
      },
      {
        title: 'Viroids',
        content: 'Viroids are infectious agents smaller than viruses, discovered by T.O. Diener in 1971. They are free RNA molecules without a protein coat and cause diseases like potato spindle tuber disease. Their RNA has low molecular weight and is capable of infecting plants, making them unique among known pathogens.',
      },
      {
        title: 'Prions',
        content: 'Prions are infectious agents made of abnormally folded proteins without nucleic acids. They transmit neurological diseases such as mad cow disease (BSE) in cattle and Creutzfeldt–Jacob disease (CJD) in humans. They are similar in size to viruses and are resistant to standard methods of deactivation, making them particularly dangerous.',
      },
      {
        title: 'Lichens',
        content: 'Lichens are symbiotic associations between algae (phycobiont) and fungi (mycobiont). Algae provide food through photosynthesis, while fungi offer shelter, water, and minerals. Lichens are sensitive to pollution and serve as environmental indicators. They are considered a single organism despite being a close combination of two different life forms.',
      },
      {
        title: 'Biological classification',
        content: 'Aristotle began classifying life based on morphology. Linnaeus introduced the two-kingdom system. Whittaker expanded it into five kingdoms: Monera, Protista, Fungi, Plantae, and Animalia. Classification is based on cell structure, organisation, nutrition, reproduction, and phylogeny. Each kingdom includes distinct life forms from unicellular prokaryotes to multicellular eukaryotes.',
      },
      {
        title: 'Kingdom Monera',
        content: 'Kingdom Monera includes prokaryotic organisms like bacteria, which are found everywhere. They show immense metabolic diversity and may be autotrophic (photosynthetic or chemosynthetic) or heterotrophic. These organisms lack membrane-bound organelles and a true nucleus. Monerans reproduce mostly asexually through binary fission or budding.',
      },
      {
        title: 'Kingdom Protista',
        content: 'Protists are single-celled eukaryotes like chrysophytes, dinoflagellates, euglenoids, slime moulds, and protozoans. They have a nucleus and membrane-bound organelles. Protists can be autotrophic or heterotrophic and reproduce both asexually and sexually. They serve as a link between prokaryotes and more complex eukaryotic organisms.',
      },
      {
        title: 'Kingdom Fungi',
        content: 'Fungi are heterotrophic eukaryotes that absorb nutrients from dead or decaying matter (saprophytes). They reproduce through spores by asexual and sexual means. Fungi show a wide range of forms and habitats. Major classes include phycomycetes, ascomycetes, basidiomycetes, and deuteromycetes.',
      },
      {
        title: 'Kingdom Plantae',
        content: 'Kingdom Plantae comprises eukaryotic, chlorophyll-containing organisms. It includes algae, bryophytes, pteridophytes, gymnosperms, and angiosperms. Plants perform photosynthesis and exhibit alternation of generations between haploid gametophyte and diploid sporophyte stages. They are primary producers and crucial to terrestrial and aquatic ecosystems.',
      },
      {
        title: 'Kingdom Animalia',
        content: 'Kingdom Animalia includes multicellular, heterotrophic eukaryotes that lack cell walls. Animals rely on other organisms for food and exhibit a range of body plans and organ systems. They reproduce mainly sexually and show complex growth and development. Animalia encompasses all vertebrates and invertebrates.',
      },
      {
        title: 'Kingdom Protista',
        content: 'Protista includes all single-celled eukaryotic organisms. They are primarily aquatic and may be photosynthetic, heterotrophic, or saprophytic. Protists have membrane-bound organelles and reproduce sexually or asexually. This kingdom forms a link between plants, animals, and fungi. Members include chrysophytes, dinoflagellates, euglenoids, slime moulds, and protozoans.',
      },
      {
        title: 'Chrysophytes',
        content: 'Chrysophytes include diatoms and golden algae. They are microscopic, mostly photosynthetic, and float in water currents. Diatoms have silica-embedded cell walls forming overlapping shells. Their deposits form diatomaceous earth, used in polishing and filtration. Diatoms are major producers in oceans and contribute significantly to the aquatic food chain.',
      },
      {
        title: 'Dinoflagellates',
        content: 'Dinoflagellates are mostly marine, photosynthetic organisms with two flagella and cellulose-plated walls. They come in various colors depending on their pigments. Red dinoflagellates like Gonyaulax may cause red tides, which can release toxins harmful to marine life such as fish, affecting the ecological balance of marine habitats.',
      },
      {
        title: 'Euglenoids',
        content: 'Euglenoids are freshwater protists found in stagnant water. They lack a cell wall and have a flexible protein-rich pellicle. They have two flagella and show dual nutrition – photosynthetic in light, heterotrophic in darkness. Their pigments resemble those of higher plants. Euglena is a common example of a euglenoid.',
      },
      {
        title: 'Slime moulds',
        content: 'Slime moulds are saprophytic protists that feed on decaying matter. Under favorable conditions, they form a large plasmodium. During adverse conditions, they form fruiting bodies with spores. These spores are resistant and can survive harsh environments. Spores are dispersed by air currents, aiding in their distribution and survival.',
      },
      {
        title: 'Protozoans',
        content: 'Protozoans are heterotrophic protists and include four groups: amoeboid, flagellated, ciliated, and sporozoans. Amoeboids use pseudopodia for movement; flagellates like Trypanosoma cause diseases; ciliated forms like Paramoecium use cilia for feeding and movement; sporozoans like Plasmodium have infectious stages and cause diseases such as malaria.',
      },
    ],
  },

  'Plant Kingdom': {
    intro: 'Algae, Bryophytes, Pteridophytes, Gymnosperms and Angiosperms.',
    sections: [
      {
        title: 'Introduction To Plant Kingdom',
        content: 'Whittaker’s five-kingdom system included Plantae, which excluded fungi, cyanobacteria, and some protists. The plant kingdom includes algae, bryophytes, pteridophytes, gymnosperms, and angiosperms. Early classification used superficial traits, while modern systems use evolutionary relationships, anatomy, embryology, phytochemistry, and tools like numerical taxonomy, cytotaxonomy, and chemotaxonomy.',
      },
      {
        title: 'Algae',
        content: 'Algae are aquatic, chlorophyll-bearing, thalloid autotrophs found in various habitats. They reproduce by fragmentation, spores (asexual), and gametes (sexual). Gametes can be isogamous, anisogamous, or oogamous. Algae fix CO₂, release oxygen, and serve as primary producers. Algin, carrageen, agar, and Chlorella are economically important. Algae are grouped into Chlorophyceae, Phaeophyceae, and Rhodophyceae.',
      },
      {
        title: 'Chlorophyceae',
        content: 'Chlorophyceae or green algae are unicellular, colonial, or filamentous with chlorophyll a and b in chloroplasts of varied shapes. Pyrenoids store starch and protein. Cell walls have cellulose and pectose. They reproduce by fragmentation, flagellated zoospores, and sexual methods (isogamy, anisogamy, oogamy). Common examples include Chlamydomonas, Volvox, Ulothrix, Spirogyra, and Chara.',
      },
      {
        title: 'Phaeophyceae',
        content: 'Phaeophyceae or brown algae are marine, ranging from filamentous to large kelps. They have chlorophyll a, c, carotenoids, and fucoxanthin, giving them a brown color. Food is stored as laminarin or mannitol. Reproduction is by fragmentation, biflagellate zoospores, and gametes (isogamy, anisogamy, oogamy). Examples include Ectocarpus, Laminaria, Sargassum, and Fucus.',
      },
      {
        title: 'Rhodophyceae',
        content: 'Rhodophyceae or red algae are mostly marine with red pigment phycoerythrin. They inhabit both shallow and deep waters. Thalli are multicellular with complex structures. Food is stored as floridean starch. Reproduction includes fragmentation, non-motile spores, and oogamous sexual reproduction with post-fertilisation changes. Common members are Polysiphonia, Porphyra, Gracilaria, and Gelidium.',
      },
      {
        title: 'General Characteristics',
        content: 'Bryophytes include mosses and liverworts, commonly found in moist, shaded areas. They are known as amphibians of the plant kingdom since they live on land but require water for reproduction. Their body is thallus-like and lacks true roots, stems, and leaves. The main plant body is a haploid gametophyte producing gametes in multicellular sex organs.',
      },
      {
        title: 'Reproduction And Sporophyte',
        content: 'Male antheridia produce biflagellate antherozoids that swim in water to reach the flask-shaped archegonia, where fertilisation occurs. The resulting diploid zygote develops into a sporophyte, which remains attached to and dependent on the gametophyte. Meiosis in the sporophyte produces haploid spores that germinate into new gametophytes.',
      },
      {
        title: 'Ecological And Economic Importance',
        content: 'Though of limited economic value, bryophytes help in ecological succession and soil formation. Mosses prevent soil erosion and retain moisture. Sphagnum moss is used for fuel and as a packing material due to its high water-holding capacity. Bryophytes also provide food to small herbivores and birds.',
      },
      {
        title: 'Liverworts',
        content: 'Liverworts, such as Marchantia, grow in moist, shady areas. Their thallus is dorsiventral and lies close to the ground. Asexually, they reproduce through fragmentation or gemmae formed in gemma cups. During sexual reproduction, male and female organs form on the same or different thalli. The sporophyte consists of a foot, seta, and capsule.',
      },
      {
        title: 'Mosses',
        content: 'Mosses have a two-stage gametophyte: the filamentous protonema and the leafy stage. Leafy gametophytes have spirally arranged leaves and multicellular rhizoids. They reproduce vegetatively by fragmentation or budding and sexually by antheridia and archegonia on leafy shoots. The sporophyte has a foot, seta, and capsule with mechanisms for spore dispersal.',
      },
      {
        title: 'General Characteristics',
        content: 'Pteridophytes include ferns and horsetails. They are the first vascular plants with xylem and phloem. Found in cool, damp, shady places, they also grow in sandy soils. Used for medicines, soil binding, and as ornamentals, their main plant body is a sporophyte with true root, stem, and leaves having vascular tissues.',
      },
      {
        title: 'Leaf Types And Sporangia',
        content: 'Leaves may be small (microphylls, e.g., Selaginella) or large (macrophylls, e.g., ferns). Sporophytes bear sporangia on sporophylls. Sporophylls may form compact structures like cones or strobili in Selaginella and Equisetum. Sporangia produce spores through meiosis which germinate into gametophytes.',
      },
      {
        title: 'Gametophyte And Reproduction',
        content: 'Spores grow into small, multicellular, photosynthetic gametophytes called prothallus. These bear male (antheridia) and female (archegonia) sex organs. Water is needed for male gamete (antherozoid) movement to archegonium for fertilisation. The zygote forms the sporophyte, which is the dominant phase.',
      },
      {
        title: 'Homosporous And Heterosporous Plants',
        content: 'Most pteridophytes are homosporous producing similar spores. Selaginella and Salvinia are heterosporous, producing large (megaspores) and small (microspores) spores. Megaspores and microspores form female and male gametophytes, respectively. Zygote development inside the female gametophyte marks a step towards seed habit.',
      },
      {
        title: 'Classification Of Pteridophytes',
        content: 'Pteridophytes are classified into four classes: Psilopsida (Psilotum), Lycopsida (Selaginella, Lycopodium), Sphenopsida (Equisetum), Pteropsida (Dryopteris, Pteris, Adiantum).',
      },
      {
        title: 'Gymnosperms',
        content: 'Gymnosperms are seed-producing plants with naked ovules not enclosed in an ovary wall. They include tall trees like Sequoia and shrubs. Roots are usually taproots, sometimes associated with mycorrhiza (Pinus) or nitrogen-fixing cyanobacteria (Cycas). Leaves are needle-like or pinnate, adapted to harsh climates with thick cuticles and sunken stomata to reduce water loss.',
      },
      {
        title: 'Reproduction in gymnosperms',
        content: 'Gymnosperms are heterosporous, producing microspores and megaspores in male and female cones (strobili). Male cones bear microsporangia forming pollen grains; female cones bear ovules on megasporophylls. Fertilisation occurs via pollen tubes carrying male gametes to the archegonia.',
      },
    ],
  },

  'Animal Kingdom': {
    intro: 'Basis of classification and the major animal phyla.',
    sections: [
      {
        title: 'Animal kingdom',
        content: 'There are over a million known animal species, each with diverse structures and forms. Due to this diversity, classification becomes essential for organizing species systematically and for identifying and assigning new species a proper position in the biological system.',
      },
      {
        title: 'Basis of classification',
        content: 'Despite structural differences among animals, classification is based on common features such as cell arrangement, body symmetry, type of coelom, and patterns of digestive, circulatory, and reproductive systems. These characteristics help in grouping animals with similar traits.',
      },
      {
        title: 'Levels of organisation',
        content: 'All animals are multicellular, but they differ in cellular organization. Sponges show cellular level, coelenterates show tissue level, platyhelminthes show organ level, and annelids, arthropods, molluscs, echinoderms and chordates show organ system level, where organs form systems for specific functions.',
      },
      {
        title: 'Digestive system',
        content: 'In lower animals like platyhelminthes, the digestive system is incomplete with a single opening serving as both mouth and anus. In higher animals, a complete digestive system has separate openings for mouth and anus for more efficient digestion and waste removal.',
      },
      {
        title: 'Circulatory system',
        content: 'The circulatory system is of two types. In the open type, blood is pumped out and directly bathes tissues. In the closed type, blood circulates through vessels like arteries, veins, and capillaries, providing better control over distribution and pressure of blood flow.',
      },
      {
        title: 'Symmetry',
        content: 'Animals are classified based on symmetry. Sponges are asymmetrical and cannot be divided into equal halves. Coelenterates, ctenophores, and echinoderms show radial symmetry, where any plane through the central axis divides the body equally. Annelids and arthropods show bilateral symmetry, where only one plane divides the body into identical left and right halves.',
      },
      {
        title: 'Diploblastic and triploblastic organisation',
        content: 'Diploblastic animals have two embryonic layers: ectoderm and endoderm, with a non-cellular mesoglea in between, as seen in coelenterates. Triploblastic animals have a third germinal layer, the mesoderm, between the ectoderm and endoderm. This organization is found from platyhelminthes to chordates.',
      },
      {
        title: 'Coelom',
        content: 'Coelom is the body cavity between the body wall and gut wall, lined by mesoderm. Animals with true coelom are called coelomates, like annelids and chordates. If not fully lined by mesoderm, it is a pseudocoelom, seen in aschelminthes. Animals without any body cavity are acoelomates, such as platyhelminthes.',
      },
      {
        title: 'Segmentation',
        content: 'In certain animals, the body is divided both externally and internally into repeated segments. This type of body organisation is called metameric segmentation. Each segment may contain repeated organs. This phenomenon, known as metamerism, is seen in animals like earthworms and aids in efficient body movement and organ function.',
      },
      {
        title: 'Notochord',
        content: 'Notochord is a rod-like structure derived from the mesoderm, present on the dorsal side during embryonic development. Animals possessing a notochord are known as chordates. Those lacking it, such as members from porifera to echinoderms, are called non-chordates. The presence or absence of notochord is a key feature in animal classification.',
      },
      {
        title: 'Basis Of Classification',
        content: 'Animals in Kingdom Animalia are classified based on common fundamental features such as body symmetry, level of organisation, presence or absence of coelom, segmentation, and notochord. These features help in understanding the structural and functional diversity among animals and form the basis of grouping them into different phyla.',
      },
      {
        title: 'General Characteristics',
        content: 'Members of phylum Porifera are commonly known as sponges. They are mostly marine and asymmetrical animals. These are primitive multicellular organisms with a cellular level of organisation. They possess a unique water canal system that aids in food collection, respiration, and waste removal. Water flows through ostia into the spongocoel and exits via the osculum.',
      },
      {
        title: 'Body Structure And Digestion',
        content: 'The body wall of sponges contains choanocytes or collar cells that line the spongocoel and canals. Digestion is intracellular. A skeleton made of spicules or spongin fibres supports the body. Sponges show hermaphroditism, meaning both eggs and sperms are produced by the same individual. Fertilisation is internal, and development includes a distinct larval stage.',
      },
      {
        title: 'Reproduction In Sponges',
        content: 'Sponges reproduce asexually by fragmentation and sexually through gamete formation. Internal fertilisation takes place, and the development is indirect, involving a larval stage different in form from the adult. These characteristics help them survive in aquatic environments and contribute to their regeneration capabilities.',
      },
      {
        title: 'Examples Of Porifera',
        content: 'Examples of organisms in phylum Porifera include Sycon (also known as Scypha), Spongilla (a freshwater sponge), and Euspongia (commonly called bath sponge). These examples show the diversity of habitat and structure found within the phylum.',
      },
      {
        title: 'General Characteristics',
        content: 'Coelenterates are aquatic animals, mostly marine, and can be either sessile or free-swimming. They are radially symmetrical and have a tissue-level organisation. Their bodies are diploblastic and contain a central gastrovascular cavity with one opening. Digestion is both extracellular and intracellular.',
      },
      {
        title: 'Cnidoblasts And Functions',
        content: 'The name Cnidaria comes from cnidoblasts or cnidocytes present on tentacles and body. These cells contain stinging structures called nematocysts and are used for anchorage, defence, and prey capture.',
      },
      {
        title: 'Body Forms And Symmetry',
        content: 'Cnidarians show two body forms: polyp and medusa. Polyps are cylindrical and sessile (e.g., Hydra, Adamsia), while medusae are umbrella-shaped and free-swimming (e.g., Aurelia). Some, like Obelia, exhibit both forms in a life cycle called metagenesis.',
      },
      {
        title: 'Skeleton And Digestion',
        content: 'Certain cnidarians, like corals, possess an exoskeleton made of calcium carbonate. Digestion occurs in the gastrovascular cavity and is both extracellular and intracellular. The mouth is located on a structure called the hypostome.',
      },
      {
        title: 'Examples Of Coelenterates',
        content: 'Common examples of cnidarians include Physalia (Portuguese man-of-war), Adamsia (Sea anemone), Pennatula (Sea-pen), Gorgonia (Sea-fan), Meandrina (Brain coral), Aurelia (Medusa), and Obelia, which exhibits alternation of generations.',
      },
      {
        title: 'General characteristics',
        content: 'Arthropoda is the largest phylum in Animalia, including insects and comprising over two-thirds of all named species. They have an organ-system level of organisation, are bilaterally symmetrical, triploblastic, segmented, and coelomate. Their body is divided into head, thorax, and abdomen, and is covered by a chitinous exoskeleton.',
      },
      {
        title: 'Appendages and respiration',
        content: 'Arthropods have jointed appendages. Their respiratory organs vary and may include gills, book gills, book lungs, or a tracheal system, depending on the group. These structures help in efficient gas exchange for terrestrial and aquatic species.',
      },
      {
        title: 'Circulation and excretion',
        content: 'The circulatory system in arthropods is of the open type. Excretion takes place through malpighian tubules. Sensory organs such as antennae, compound and simple eyes, and statocysts are present and help in perception and balance.',
      },
      {
        title: 'Reproduction and development',
        content: 'Most arthropods are dioecious with internal fertilisation. They are typically oviparous. Development may be direct or indirect depending on the species, involving metamorphosis in many cases.',
      },
      {
        title: 'Examples and significance',
        content: 'Examples include Apis (Honey bee), Bombyx (Silkworm), Laccifer (Lac insect), Anopheles, Culex, Aedes (mosquitoes), Locusta (Locust), and Limulus (King crab). Many have economic importance, act as disease vectors, or are considered pests or living fossils.',
      },
      {
        title: 'Phylum Mollusca',
        content: 'Molluscs are the second largest animal phylum, found in terrestrial and aquatic habitats. They have a bilaterally symmetrical, coelomate, triploblastic body with an organ-system level of organisation. Body is unsegmented and includes a head, muscular foot, and visceral hump covered by a calcareous shell and mantle.',
      },
      {
        title: 'Body structure and organs',
        content: 'Molluscs have a mantle cavity containing feather-like gills for respiration and excretion. The anterior head has sensory tentacles, and a file-like rasping organ called radula in the mouth helps in feeding. They are usually dioecious, oviparous, and show indirect development.',
      },
      {
        title: 'Examples of molluscs',
        content: 'Examples include Pila (Apple snail), Pinctada (Pearl oyster), Sepia (Cuttlefish), Loligo (Squid), Octopus (Devil fish), Aplysia (Seahare), Dentalium (Tusk shell), and Chaetopleura (Chiton).',
      },
      {
        title: 'Phylum Echinodermata',
        content: 'Echinoderms are exclusively marine animals with organ-system level organisation. They have a calcareous endoskeleton of ossicles, making their bodies spiny. Adults show radial symmetry, while larvae are bilaterally symmetrical. They are triploblastic and coelomate. The digestive system is complete, with the mouth on the ventral side and the anus on the dorsal side.',
      },
      {
        title: 'Water Vascular System In Echinoderms',
        content: 'A unique feature of echinoderms is the water vascular system that aids in locomotion, food capture, transport, and respiration. Excretory system is absent. Sexes are separate and reproduction is sexual. Fertilisation is usually external and development is indirect with a free-swimming larval stage. Examples include Asterias, Echinus, Antedon, Cucumaria, and Ophiura.',
      },
      {
        title: 'Phylum Hemichordata',
        content: 'Hemichordata is now considered a separate phylum under non-chordates. These are worm-like marine animals showing organ-system level organisation. They are bilaterally symmetrical, triploblastic, and coelomate. The body has an anterior proboscis, a collar, and a trunk. Circulatory system is open, respiration occurs via gills, and the excretory organ is the proboscis gland.',
      },
      {
        title: 'Reproduction In Hemichordates',
        content: 'Hemichordates are unisexual with separate sexes. Fertilisation takes place externally in the surrounding water. Development is indirect, meaning it involves a larval stage before becoming an adult. Examples of hemichordates include Balanoglossus and Saccoglossus.',
      },
      {
        title: 'Phylum Chordata',
        content: 'Chordates are bilaterally symmetrical, triploblastic, coelomate animals with a notochord, dorsal hollow nerve cord, pharyngeal gill slits, post-anal tail, and closed circulatory system. They show organ-system level of organization. They are classified into Urochordata, Cephalochordata, and Vertebrata based on the position and persistence of the notochord.',
      },
      {
        title: 'Protochordates',
        content: 'Urochordates and Cephalochordates are marine protochordates. Urochordates like Ascidia and Salpa have a notochord only in the larval tail. In Cephalochordates like Branchiostoma, the notochord extends from head to tail and remains throughout life. Both groups lack a vertebral column.',
      },
      {
        title: 'Subphylum Vertebrata',
        content: 'Vertebrates have a notochord during embryonic development, later replaced by a vertebral column. They possess a ventral muscular heart, kidneys, and paired appendages. They are further classified into Cyclostomata, Chondrichthyes, Osteichthyes, Amphibia, Reptilia, Aves, and Mammalia.',
      },
      {
        title: 'Class Cyclostomata',
        content: 'Cyclostomes like Petromyzon and Myxine are jawless ectoparasites on fishes. They have a cartilaginous skeleton, circular sucking mouth, and multiple gill slits. They are marine but migrate to freshwater for spawning. They lack paired fins and scales.',
      },
      {
        title: 'Class Chondrichthyes',
        content: 'These are marine, cartilaginous fishes with a ventrally placed mouth, placoid scales, and powerful jaws. They lack an air bladder and must swim constantly. Examples include Scoliodon, Trygon, and Carcharodon. Fertilisation is internal and most are viviparous.',
      },
      {
        title: 'Class Osteichthyes',
        content: 'These bony fishes live in marine and freshwater habitats. They have bony skeletons, gills covered by opercula, air bladders, and ctenoid or cycloid scales. Examples include Labeo, Hippocampus, and Exocoetus. Fertilisation is usually external, and most are ovipar',
      },
      {
        title: 'Class Amphibia',
        content: 'Amphibians like frogs and salamanders can live on land and water. They have moist skin, limbs, lungs, gills, and cloaca. Respiration is through skin, lungs, and gills. They are cold-blooded, oviparous, and undergo indirect development.',
      },
      {
        title: 'Class Reptilia',
        content: 'Reptiles like lizards, snakes, and crocodiles are terrestrial with dry, scaly skin. They are cold-blooded, lay eggs (oviparous), and have internal fertilisation. Crocodiles have a four-chambered heart, while others have three. Tympanum acts as an ear.',
      },
      {
        title: 'Class Aves',
        content: 'Birds have feathers, beaks, pneumatic bones, and wings. Their hearts are four-chambered, and they are warm-blooded. Air sacs aid respiration. Fertilisation is internal, development is direct, and they are oviparous. Examples include Pigeon, Parrot, Ostrich, and Penguin.',
      },
      {
        title: 'Class Mammalia',
        content: 'Mammals are warm-blooded with hair and mammary glands. They have lungs, a four-chambered heart, and external ears. Fertilisation is internal, and most are viviparous. Examples include humans, lions, whales, rats, and the oviparous Platypus.',
      },
      {
        title: 'Comparison of chordates and non-chordates',
        content: 'Chordates have a notochord, dorsal hollow nerve cord, gill slits, ventral heart, and post-anal tail. Non-chordates lack these features. Their nerve cord is ventral, solid, and double; heart, if present, is dorsal; and post-anal tail is absent.',
      },
    ],
  },

  'Morphology of Flowering Plants': {
    intro: 'Root, stem, leaf, inflorescence, flower, fruit and seed.',
    sections: [
      {
        title: 'Diversity in higher plants',
        content: 'Despite their vast structural diversity, all angiosperms have roots, stems, leaves, flowers, and fruits. To classify and understand plants, we use standard terms and definitions. We must also recognize the variations in plant parts as adaptations to different environments for purposes like storage, climbing, or protection.',
      },
      {
        title: 'Root and shoot system',
        content: 'The plant body is divided into root and shoot systems. The root system lies underground and the shoot system grows above the ground. If you pull out any weed, you’ll observe roots, stems, and leaves. Some may also have flowers and fruits.',
      },
      {
        title: 'Tap root system',
        content: 'In dicot plants, the radicle elongates to form the primary root, which bears secondary and tertiary roots. Together, they form the tap root system. Mustard is an example. This system grows deep into the soil and provides firm anchorage and absorption.',
      },
      {
        title: 'Fibrous root system',
        content: 'In monocot plants, the primary root is short-lived. It is replaced by many roots from the base of the stem, forming the fibrous root system. Wheat is an example. This system spreads widely in the upper soil layer for better water absorpti',
      },
      {
        title: 'Adventitious roots',
        content: 'These roots arise from parts other than the radicle, like stems or leaves. They are seen in plants such as grass, Monstera, and banyan. Adventitious roots provide additional support and perform storage or vegetative propagation in some species.',
      },
      {
        title: 'Functions of roots',
        content: 'Roots anchor the plant in soil, absorb water and minerals, store food, and synthesize plant growth regulators. Their specialized structures help plants survive in various conditions and carry out different vital roles.',
      },
      {
        title: 'Regions of the root',
        content: 'The root tip has a root cap for protection. Above it is the meristematic region with dividing cells. Then comes the elongation region where cells grow in size. Next is the maturation region where root hairs form to absorb water and minerals.',
      },
      {
        title: 'The Stem',
        content: 'The stem is the upward part of the plant axis that bears leaves, branches, flowers, and fruits. It develops from the plumule of the embryo. It has nodes where leaves grow and internodes between them. It carries buds, is green when young, and later becomes woody. It supports the plant structure and aids in conduction.',
      },
      {
        title: 'Functions Of Stem',
        content: 'The stem spreads out branches that bear leaves, flowers, and fruits. It conducts water, minerals, and food between roots and leaves. In some plants, it also stores food, offers support, protects the plant, and helps in vegetative propagation through modifications like tubers and runners.',
      },
      {
        title: 'The Leaf',
        content: 'The leaf is a lateral, typically flat, green structure developing from the node of the stem, with a bud in its axil. It arises from the shoot apical meristem and is arranged in acropetal order. It consists of three parts: leaf base, petiole, and lamina. It plays a crucial role in photosynthesis.',
      },
      {
        title: 'Venation',
        content: 'Venation refers to the pattern of veins and veinlets in the leaf lamina. Reticulate venation forms a network and is common in dicots. Parallel venation has veins running parallel and is found in monocots. Veins provide rigidity and help in the transport of water, minerals, and food.',
      },
      {
        title: 'Types Of Leaves',
        content: 'Leaves can be simple or compound. A simple leaf has an undivided lamina, while a compound leaf has incisions reaching the midrib, forming leaflets. Pinnately compound leaves have leaflets along a rachis (e.g., neem), while palmately compound leaves have all leaflets attached at a single point (e.g., silk cotton).',
      },
      {
        title: 'Phyllotaxy',
        content: 'Phyllotaxy is the pattern of leaf arrangement on a stem or branch. In alternate type, one leaf grows per node (e.g., mustard). In opposite type, a pair of leaves arises per node (e.g., guava). In whorled type, more than two leaves arise from a node forming a circle, as in Alstonia.',
      },
      {
        title: 'The Inflorescence',
        content: 'Inflorescence is the arrangement of flowers on the floral axis. A flower is a modified shoot where the apical meristem forms floral parts instead of leaves. If the shoot tip becomes a flower, it\'s solitary. Based on growth pattern of the main axis, inflorescence is classified into racemose and cymose types.',
      },
      {
        title: 'Racemose Inflorescence',
        content: 'In racemose inflorescence, the main floral axis continues to grow. Flowers are borne laterally in acropetal succession, meaning older flowers are at the base and younger ones at the top. This type of inflorescence has an unlimited growth pattern of the floral axis and is commonly seen in mustard and radish.',
      },
      {
        title: 'Cymose Inflorescence',
        content: 'In cymose inflorescence, the main floral axis terminates in a flower, limiting its growth. Flowers develop in basipetal succession, where the older flowers are at the top and younger ones at the base. This type of inflorescence shows a determinate growth pattern and is seen in jasmine and guava.',
      },
      {
        title: 'The flower',
        content: 'A flower is the reproductive unit of angiosperms, meant for sexual reproduction. It typically consists of four whorls—calyx, corolla, androecium, and gynoecium—arranged on the thalamus. Flowers can be bisexual or unisexual and show actinomorphic, zygomorphic, or asymmetric symmetry. Based on floral part positions, flowers can be hypogynous, perigynous, or epigynous.',
      },
      {
        title: 'Parts of a flower',
        content: 'A flower consists of four main whorls: calyx, corolla, androecium, and gynoecium. Calyx has green, protective sepals; corolla has often brightly coloured petals. These may be free (poly-) or fused (gamo-). The arrangement of sepals or petals in the bud is called aestivation, types include valvate, twisted, imbricate, and vexillary.',
      },
      {
        title: 'Androecium',
        content: 'Androecium consists of stamens with filaments and bilobed anthers containing pollen sacs. Stamens may be free or fused (monoadelphous, diadelphous, polyadelphous). They may be attached to petals (epipetalous) or perianth (epiphyllous). Sterile stamens are called staminodes. Variation in filament length occurs in some flowers like Salvia and mustard.',
      },
      {
        title: 'Gynoecium',
        content: 'Gynoecium is the female part of the flower composed of carpels, each having stigma, style, and ovary. Carpels may be free (apocarpous) or fused (syncarpous). Placentation refers to ovule arrangement and can be marginal, axile, parietal, basal, or free central, based on how ovules attach within the ovary.',
      },
      {
        title: 'The fruit',
        content: 'Fruit is a mature ovary formed after fertilisation and is unique to flowering plants. Sometimes, fruits develop without fertilisation and are called parthenocarpic fruits. A typical fruit consists of a pericarp and seeds. The pericarp can be dry or fleshy and may be divided into epicarp, mesocarp, and endocarp when fleshy.',
      },
      {
        title: 'Drupe fruits',
        content: 'Mango and coconut are examples of drupe fruits formed from monocarpellary superior ovaries and are one-seeded. In mango, the pericarp is clearly divided into epicarp, fleshy edible mesocarp, and stony hard endocarp. In coconut, the mesocarp is fibrous and the fruit has a similar structure, showing drupe characteristics.',
      },
      {
        title: 'The seed',
        content: 'After fertilisation, ovules develop into seeds consisting of a seed coat and an embryo. The embryo includes a radicle, an embryonal axis, and one (in maize, wheat) or two cotyledons (in gram, pea). Cotyledons store food and support early growth.',
      },
      {
        title: 'Structure of a dicotyledonous seed',
        content: 'A dicot seed has a seed coat with two layers: testa and tegmen. The hilum marks seed attachment to fruit, and micropyle is a tiny opening. The embryo includes two cotyledons, radicle, and plumule. Seeds like castor have endosperm, while gram and pea lack it and are non-endospermous.',
      },
      {
        title: 'Structure of a monocotyledonous seed',
        content: 'Monocot seeds like maize are usually endospermic. The seed coat is thin and fused with the fruit wall. The large endosperm stores food and is separated from the embryo by the aleurone layer. The embryo has one cotyledon (scutellum), plumule and radicle enclosed in coleoptile and coleorhiza respectively.',
      },
      {
        title: 'Solanaceae',
        content: 'Solanaceae is a large family commonly known as the potato family, found in tropical, subtropical, and temperate regions. The plants are mostly herbs or shrubs with alternate, simple leaves and reticulate venation. Flowers are bisexual and actinomorphic with five united petals and sepals. Fruits are berries or capsules. Economically, the family provides food (tomato, potato), spices (chilli), medicines (belladonna), and ornamentals (petunia).',
      },
    ],
  },

  'Anatomy of Flowering Plants': {
    intro: 'Tissues and the internal structure of dicot and monocot plants.',
    sections: [
      {
        title: 'Dicotyledonous Root',
        content: 'The dicot root shows an epiblema with root hairs, a cortex of parenchyma cells, and an endodermis with Casparian strips. The pericycle initiates lateral roots and vascular cambium. Xylem and phloem form a radial arrangement with conjunctive tissue. The stele includes pericycle, vascular bundles and pith. Cambium later forms a ring for secondary growth.',
      },
      {
        title: 'Monocotyledonous Root',
        content: 'Monocot roots have similar tissues as dicots: epidermis, cortex, endodermis, and pericycle. However, they usually have more than six xylem bundles (polyarch), and a large, well-developed pith. Unlike dicot roots, they do not undergo secondary growth. The vascular bundles form a radial pattern with no cambium between xylem and phloem.',
      },
      {
        title: 'Dicotyledonous Stem',
        content: 'The dicot stem has an epidermis with a cuticle, collenchymatous hypodermis, and parenchymatous cortex. Endodermis stores starch, and the pericycle forms sclerenchymatous patches. Vascular bundles are arranged in a ring, conjoint, open, and endarch. Medullary rays separate them. A prominent pith occupies the central region of the stem.',
      },
      {
        title: 'Monocotyledonous Stem',
        content: 'The monocot stem has a sclerenchymatous hypodermis and scattered vascular bundles surrounded by bundle sheaths. Vascular bundles are conjoint, closed, and smaller at the periphery. The ground tissue is parenchymatous and extensive. Phloem parenchyma is absent, and vascular bundles contain water-filled cavities.',
      },
      {
        title: 'Dorsiventral Leaf',
        content: 'Dorsiventral (dicot) leaf has adaxial and abaxial epidermis with cuticle and more stomata on the lower side. Mesophyll is differentiated into palisade and spongy parenchyma for photosynthesis and gas exchange. Vascular bundles lie in the veins and midrib, surrounded by a bundle sheath. Reticulate venation causes varied bundle sizes.',
      },
      {
        title: 'Isobilateral Leaf',
        content: 'Isobilateral (monocot) leaf shows stomata on both surfaces and undifferentiated mesophyll. Bulliform cells in the adaxial epidermis help conserve water by curling the leaf. Vascular bundles are nearly uniform in size due to parallel venation. These adaptations help monocot leaves survive varying water conditions and sunlight exposure.',
      },
    ],
  },

  'Structural Organisation in Animals': {
    intro: 'Animal tissues and the morphology and anatomy of the frog.',
    sections: [
      {
        title: 'Frogs',
        content: 'Frogs are amphibians belonging to phylum Chordata. The common Indian species is Rana tigrina. They are cold-blooded, capable of mimicry, and undergo aestivation and hibernation to survive harsh conditions. Their ability to change colour provides protection, and they absorb water through their skin rather than drinking it.',
      },
      {
        title: 'Morphology',
        content: 'Frog\'s skin is smooth, slippery, and moist due to mucus. They have olive green dorsal skin with dark spots and pale yellow ventral skin. Body is divided into head and trunk, with no neck or tail. Eyes have protective nictitating membranes. Hind limbs are long and webbed for swimming, and males show vocal sacs and copulatory pads.',
      },
      {
        title: 'Anatomy',
        content: 'The body cavity houses systems like digestive, circulatory, respiratory, nervous, excretory, and reproductive. The alimentary canal is short due to their carnivorous diet. Digestion starts in the stomach and ends in the intestine where absorption occurs. Respiration occurs through skin, buccal cavity, and lungs, depending on habitat and activity.',
      },
      {
        title: 'Circulatory system',
        content: 'Frog\'s circulatory system is a closed type with a three-chambered heart. It includes arteries, veins, blood, and a lymphatic system. Special portal systems like hepatic and renal portal are present. Blood has nucleated RBCs with haemoglobin, WBCs, and platelets. Lymph lacks RBCs and some proteins.',
      },
      {
        title: 'Excretory system',
        content: 'The excretory system includes kidneys, ureters, urinary bladder, and cloaca. Kidneys filter urea from blood. Males use ureters as urinogenital ducts, while females have separate ducts for urine and ova. Frogs are ureotelic and excrete urea. Excretion helps in maintaining nitrogenous waste balance in the body.',
      },
      {
        title: 'Nervous and endocrine systems',
        content: 'Frog’s coordination is controlled by neural and endocrine systems. The nervous system includes brain, spinal cord, nerves, and ganglia. Brain has forebrain, midbrain, and hindbrain. Ten pairs of cranial nerves arise from the brain. Endocrine glands like pituitary, thyroid, adrenal, etc., regulate various physiological functions through hormones.',
      },
      {
        title: 'Sense organs',
        content: 'Frog’s sense organs include eyes, tympanum, sensory papillae, taste buds, and nasal epithelium. Eyes are simple and well-developed. Tympanum acts as both ear and balance organ. Other sense organs are cellular aggregations responding to stimuli. Frogs have no external ear, and hearing is through tympanum and internal ears.',
      },
      {
        title: 'Reproductive system',
        content: 'Frogs reproduce sexually with separate male and female organs. Males have testes, vasa efferentia, and cloaca for sperm transfer. Females have ovaries and oviducts that open separately into the cloaca. Fertilisation is external, in water. Development includes a tadpole stage that metamorphoses into an adult. Frogs help in insect control and maintaining ecological balance.',
      },
    ],
  },

  'Cell: The Unit of Life': {
    intro: 'Cell theory, prokaryotic and eukaryotic cells and cell organelles.',
    sections: [
      {
        title: 'Cell Theory:',
        content: 'Cell Theory was formulated by Schleiden and Schwann, and was modified by Rudolf Virchow. Cell theory states that:',
      },
      {
        title: 'Cell:',
        content: 'Cell is the structural and functional unit of life.',
      },
      {
        title: 'Gram Positive Bacteria:',
        content: 'Bacteria that take up gram Stain. e.g., Bacillus Gram Negative Bacteria: Bacteria do not take up gram stain e.g., Escherichia coli',
      },
      {
        title: 'PROKARYOTIC CELL :',
        content: 'Modification of cell envelope:',
      },
      {
        title: 'Functions of cell envelope:',
        content: 'Cell wall formation, DNA replication and distribution to daughter cells, respiration, secretion processes, to increase surface area of plasma membrane and enzyme content.',
      },
      {
        title: 'Genetic Material:',
        content: 'It is not covered by nuclear envelope. In addition to the genomic DNA (the single chromosome/circular DNA), many bacteria have small circular self replicating, double stranded DNA which is called as plasmid, plasmid contain genes like antibiotic resistance.',
      },
      {
        title: 'Ribosomes:',
        content: 'Associated with plasma membrane of prokaryatic cell, site of protein synthesis. Several ribosomes may attach to a single mRNA and form a chain called polyribosomes or polysomes. They translate mRNA into Proteins.',
      },
      {
        title: 'Inclusion Bodies:',
        content: 'Stores reserve material, lie freely in cytoplasm not bound by any membrane. e.g. phosphate granules, cyanophycean granules and glycogen granules.',
      },
      {
        title: 'Eukaryotic cells:',
        content: 'Possess an oragnized nucleus with nuclear envelope and have a variety of complex locomotory and cytoskeletal structures.',
      },
      {
        title: 'Cell Membrane:',
        content: 'Singer and Nicolson (1972) gave ‘fluid mosaic model’. According to this the quasi-fluid nature of lipid enables lateral movement of proteins within the overall bilayer; two types of proteins (Peripheral and integral proteins) with cholesterol, glycolipids and glycoporteins. Erythrocyte membrane has 52% protein and 40% lipids.',
      },
      {
        title: 'Function of Cell Membrane-',
        content: 'It is selectively permeable and helps in transport of molecule across it.',
      },
      {
        title: 'Cell Wall',
        content: 'is non-living rigid structure which gives shape to the cell and protects cell from mechanical damage and infection, helps in cell-to-cell interaction and provides barrier to undesirable macromolecules. Cell wall of algae is made of cellulose, galactans, mannans and minerals like calcium carbonate. Plant cell wall consists of cellulose, hemicellulose, pectins and proteins. Middle lamella is made of calcium pectate which holds neighbouring cells together. Plasmodesmata connect the cytoplasm of neighbouring cells.',
      },
      {
        title: 'Endoplasmic Reticulum (ER):',
        content: 'Consists of network of tiny tubular structure. ER divides the intracellular space into two distinct compartments-luminal (inside ER) and extra luminal (cytoplasm).',
      },
      {
        title: 'Function of',
        content: 'Endoplasmic Reticulum (ER):',
      },
      {
        title: 'Golgi apparatus:',
        content: 'First observed by Camillo Golgi (in 1898) Consist of cisternae stacked parallel to each other. Two faces of the organelle are convex/ cis or forming face and concave/trans or maturing face but inter connected. Functions: Performs packaging of materials, to be delivered either to the intra-cellular targets or secreted outside the cell. Important site of formation of glycoproteins and glycolipids.',
      },
      {
        title: 'Lysosomes:',
        content: 'Membrane bound vesicular structures formed by the process of packaging in the golgi apparatus. Contain hydrolysing enzymes (lipases, proteases, carbohydrases) which are optimally active at acidic pH. Also called ‘Suicidal Bag’. Function: Intracellular digestion.',
      },
      {
        title: 'Vacuoles:',
        content: 'Membrane bound space found in the cytoplasm. Contain water, sap, excretory product, etc. In plant cell, vacoule occupies 90% of space. Function: In plants tonoplast (single membrane of vacuole) faciliates transport of ions and other substances. Contractile vacuole for excretion in Amoeba and food vacuoles formed in protists for digestion of food.',
      },
      {
        title: 'Mitochondria:',
        content: 'Double membraned structure. Outer membrane smooth and inner membrane forms a number of infoldings called cristae The inner compartment is called matrix. The cristae increase the surface area,',
      },
      {
        title: 'Function of Mitochondria:',
        content: 'Sites of aerobic respiration. Called ’power houses’ of cell as produce cellular energy in the form of ATP. Matrix possesses single circular DNA molecule, a few RNA molecules, ribsomes (70S). It divides by binary fission.',
      },
      {
        title: 'Plastids:',
        content: 'Found in plant cells and in euglenoides. Chloroplasts, chromoplasts and leucoplasts are 3 types of plastids depending on pigments contained.',
      },
      {
        title: 'Function of Plastids:',
        content: 'Site of photosynthesis, and imparts colours to fruits and flowers.',
      },
      {
        title: 'Ribosomes:',
        content: 'Composed of RNA and proteins; without membrane. Eucaryotic ribosomes are 80S. S = Svedberg’s unit) Function: Site of protein synthesis',
      },
      {
        title: 'Cytoskeleton:',
        content: 'Network of filaments. Proteinaceous structure in cytoplasm made up of microtubules and microfilaments. Function: Mechanical support, motility, maintenance of the shape of the cell.',
      },
      {
        title: 'Cilia and Flagella:',
        content: 'Cilia are small structures which work like oars which help in movement. Flagella are longer and responsible for cell movement. They are covered with a plasma membrane. Core is called axoneme which has 9 + 2 arrangement of axonemal microtubules.',
      },
      {
        title: 'Centrosome and Centrioles Centrosome:',
        content: 'contains two cylindrical structures called centrioles. Surrounded by amorphous pericentriolar material. Made up of nine evenly spaced peripheral fibrils of tubulin protein (9+0). Centrioles form the basal body of cilia or flagella and spindle fibres for cell division in animal cells. They produces spindle apparatus during cell divison.',
      },
      {
        title: 'Named by Robert Brown – 1831 Structure of Nucleus:',
        content: 'Chromatin DNA + nonhistone proteins. (Named by Fleming) Nucleoplasm- Nucleolus + Chromatin Nulear membrane- It is with perinuclear space and nucleopores. Chromosomes- DNA/RNA + Histone protein/Nonhistone protein. Centromere: Primary constriction in every chromosome Kinetochores: Disc-shaped structure on the sides of centsomere. No nucleus in Erythrocytes (RBC) of mammals and sieve tubes in vascular plants.',
      },
      {
        title: 'Chromosomes (on basis of position of centromere):',
        content: 'Metacentric: Middle centromere. Sub-metacentric: Centromere nearer to one end of chromosomes. Acrocentric: Centromere situated close to its end. Telocentric: Has terminal centromere. Satellite: Some chromosomes have non-staining secondary constrictions at a constant location, which gives the appearance of small fragment called satellite.',
      },
      {
        title: 'Nucleus:',
        content: 'Double membranous with perinuclear space and nuclear pores; has Chromatin, nuclear matrix and nucleoli (site for rRNA synthesis).',
      },
      {
        title: 'Cell: The unit of life',
        content: 'Living organisms differ from non-living things by the presence of cells. All organisms are made up of cells, which are the basic unit of life. Organisms with a single cell are called unicellular, while those with many cells are called multicellular. Cells perform essential life functions and ensure independent living in unicellular organisms.',
      },
      {
        title: 'What is a cell',
        content: 'A cell is the structural and functional unit of life. Unicellular organisms perform all life processes within a single cell. Antonie Von Leeuwenhoek first observed a live cell, and Robert Brown discovered the nucleus. Advancements in microscopes, especially the electron microscope, helped scientists understand the detailed structure of cells.',
      },
      {
        title: 'Cell theory origin',
        content: 'In 1838, Schleiden observed that plants are made of cells forming tissues. Around the same time, Schwann studied animal cells and proposed that both animals and plants are composed of cells and their products. Together, they formulated the initial cell theory.',
      },
      {
        title: 'Development of cell theory',
        content: 'Schwann noted that plant cells have a cell wall, a feature absent in animal cells. The initial theory didn’t explain cell formation. In 1855, Rudolf Virchow added that new cells arise from pre-existing cells, finalizing the cell theory.',
      },
      {
        title: 'Modern cell theory',
        content: 'Modern cell theory states that (i) all living organisms are made of cells and cell products, and (ii) all cells arise from pre-existing cells. This unified concept is central to understanding the structure and function of all life forms.',
      },
      {
        title: 'Structure of Cell',
        content: 'Onion cells have a cell wall and membrane, while cheek cells have only a membrane. Both have a nucleus containing chromosomes and DNA. Cells with a membrane-bound nucleus are eukaryotic; those without are prokaryotic.',
      },
      {
        title: 'Cytoplasm and Organelles',
        content: 'The cytoplasm is a semi-fluid matrix where cellular activities occur. Eukaryotic cells have membrane-bound organelles like ER, mitochondria, Golgi complex, etc. Prokaryotic cells lack these.',
      },
      {
        title: 'Ribosomes and Centrosome',
        content: 'Ribosomes are non-membrane bound organelles found in all cells. They are present in cytoplasm, mitochondria, chloroplasts, and rough ER. Animal cells have centrosomes, aiding in cell division.',
      },
      {
        title: 'Cell Size and Shape',
        content: 'Cells differ in size, shape, and function. Mycoplasmas are the smallest cells, ostrich eggs are the largest. Red blood cells are 7 µm wide; nerve cells are longest. Shapes vary—disc, columnar, thread-like, etc.—based on their role.',
      },
      {
        title: 'Prokaryotic cells',
        content: 'Prokaryotic cells include bacteria, blue-green algae, mycoplasma, and PPLO. They are small, rapidly multiplying cells with varied shapes like bacillus, coccus, vibrio, and spirillum. They lack a well-defined nucleus and membrane-bound organelles. DNA is circular and naked. Plasmids give special traits like antibiotic resistance. Ribosomes are the only organelles present.',
      },
      {
        title: 'Cell envelope and its modifications',
        content: 'The cell envelope in bacteria consists of glycocalyx, cell wall, and plasma membrane. Glycocalyx may be a slime layer or a capsule. The cell wall provides shape and support. The plasma membrane is selectively permeable. Gram staining differentiates bacteria into Gram-positive and Gram-negative based on their envelope structure and composition.',
      },
      {
        title: 'Mesosome and chromatophores',
        content: 'Mesosomes are plasma membrane infoldings in prokaryotes that help in DNA replication, respiration, secretion, and cell wall formation. They increase surface area for enzymatic functions. Chromatophores are pigment-containing membranous structures found in photosynthetic bacteria like cyanobacteria and are involved in photosynthesis.',
      },
      {
        title: 'Flagella, pili and fimbriae',
        content: 'Flagella are long, thread-like structures that provide motility to bacteria. They consist of filament, hook, and basal body. Pili are tubular protein structures involved in conjugation. Fimbriae are short, bristle-like structures helping in adhesion to surfaces like rocks or host tissues but do not aid in movement.',
      },
      {
        title: 'Ribosomes and inclusion bodies',
        content: 'Prokaryotic ribosomes are 70S type made of 50S and 30S subunits. They synthesize proteins and often form chains called polysomes. Inclusion bodies store reserve materials like glycogen, phosphate, and cyanophycean granules. Gas vacuoles are found in photosynthetic bacteria and help in buoyancy. Inclusion bodies are non-membranous and free in cytoplasm.',
      },
      {
        title: 'Eukaryotic cells',
        content: 'Eukaryotic cells have membrane-bound organelles and a well-defined nucleus. They show compartmentalisation, have complex locomotory structures, and chromosomes. Plant cells have cell walls, plastids, and large vacuoles, while animal cells lack these but have centrioles. This structural variation supports diverse functions in plants and animals.',
      },
      {
        title: 'Cell membrane',
        content: 'The cell membrane is a lipid bilayer with proteins and carbohydrates, following the fluid mosaic model. It controls movement of substances, maintains fluidity, and enables transport. It allows passive diffusion, osmosis, and active transport using energy, such as the Na⁺/K⁺ pump. Cholesterol and proteins affect its structure and function.',
      },
      {
        title: 'Cell wall',
        content: 'The cell wall is a rigid, non-living outer layer in fungi and plants. It gives shape, protects against damage, and aids cell interactions. It is made of cellulose and other polysaccharides. The middle lamella glues cells together, and plasmodesmata connect their cytoplasm for communication.',
      },
      {
        title: 'Endomembrane system',
        content: 'The endomembrane system includes endoplasmic reticulum, Golgi complex, lysosomes, and vacuoles. Their functions are interrelated, especially in synthesis and transport. Mitochondria, chloroplasts, and peroxisomes are excluded because they function independently.',
      },
      {
        title: 'The endoplasmic reticulum',
        content: 'The ER is a network of tubules dividing the cell into compartments. RER has ribosomes and helps in protein synthesis. SER lacks ribosomes and is involved in lipid synthesis, including steroidal hormones in animals. It connects to the nuclear envelope and assists in molecular transport.',
      },
      {
        title: 'Golgi apparatus',
        content: 'The Golgi apparatus modifies, packages, and transports proteins and lipids. It has flattened cisternae with a cis face (receiving) and trans face (dispatching). Proteins from ER are processed here into glycoproteins and glycolipids. It plays a central role in secretion and intracellular transport.',
      },
      {
        title: 'Lysosomes',
        content: 'Lysosomes are vesicles formed from the Golgi apparatus containing hydrolytic enzymes active at acidic pH. They digest cellular waste, macromolecules, and damaged organelles. They are essential for cellular cleanup and recycling processes in animal cells.',
      },
      {
        title: 'Vacuoles',
        content: 'Vacuoles are storage sacs for water, waste, and nutrients. In plants, they are large and enclosed by a membrane called tonoplast, helping in ion transport and storage. In protists, they assist in osmoregulation and excretion. Food vacuoles form during phagocytosis in unicellular organisms.',
      },
      {
        title: 'Mitochondria',
        content: 'Mitochondria are double-membrane structures producing ATP via aerobic respiration, hence called the powerhouses of the cell. They have inner folds called cristae and an inner matrix with DNA, RNA, ribosomes, and enzymes. They replicate by fission and are semi-autonomous organelles.',
      },
      {
        title: 'Plastids',
        content: 'Plastids are found in plant cells and classified into chloroplasts, chromoplasts, and leucoplasts based on pigment. Chloroplasts carry out photosynthesis and contain thylakoids arranged in grana. Chromoplasts impart color, while leucoplasts store starch, oils, or proteins. Like mitochondria, plastids have their own DNA and ribosomes.T',
      },
      {
        title: 'Ribosomes',
        content: 'Ribosomes are non-membranous structures composed of RNA and proteins. Eukaryotic ribosomes are 80S with 60S and 40S subunits, while prokaryotic ribosomes are 70S with 50S and 30S subunits. They are the sites of protein synthesis and are found freely in cytoplasm or on the ER.',
      },
      {
        title: 'Cytoskeleton',
        content: 'The cytoskeleton is a network of microtubules, microfilaments, and intermediate filaments in the cytoplasm. It maintains cell shape, provides mechanical support, and facilitates intracellular transport and movement of organelles and the cell itself.',
      },
      {
        title: 'Cilia and flagella',
        content: 'Cilia and flagella are hair-like projections aiding movement. Cilia are shorter and numerous; flagella are longer. Both have a 9+2 arrangement of microtubules in their axoneme. They are anchored by basal bodies and are involved in locomotion and fluid movement over cell surfaces.',
      },
      {
        title: 'Centrosome and centrioles',
        content: 'Centrosomes contain two centrioles arranged perpendicularly. Each centriole has nine triplets of microtubules arranged in a cartwheel pattern. They help in organizing spindle fibers during cell division and form basal bodies for cilia and flagella.',
      },
      {
        title: 'Nucleus',
        content: 'The nucleus has a double membrane with pores and contains chromatin, nucleoplasm, and nucleolus. It regulates cellular activities and gene expression. Nucleoli synthesize rRNA. Chromatin condenses into chromosomes during division. The nuclear envelope connects with the ER and controls exchange between nucleus and cytoplasm.',
      },
      {
        title: 'Chromosomes',
        content: 'Chromosomes carry genetic information. Each has a centromere and may have a satellite. Based on centromere position, chromosomes are metacentric, submetacentric, acrocentric, or telocentric. Chromatin is made of DNA, histone and non-histone proteins, and RNA.',
      },
      {
        title: 'Microbodies',
        content: 'Microbodies are small membrane-bound vesicles containing enzymes. They are found in both plant and animal cells and are involved in specific metabolic activities such as detoxification and lipid metabolism.',
      },
    ],
  },

  'Biomolecules': {
    intro: 'Carbohydrates, proteins, lipids, nucleic acids, enzymes and metabolism.',
    sections: [
      {
        title: 'Biomolecules',
        content: 'Biomolecules are organic compounds found in living organisms. Elemental analysis of tissues shows elements like carbon, hydrogen, and oxygen are common to both living and non-living matter. However, carbon and hydrogen are more abundant in living tissues. Biomolecules include both organic and inorganic compounds essential for life processes.',
      },
      {
        title: 'Chemical Composition Analysis',
        content: 'To study biomolecules, tissues are ground in trichloroacetic acid, separating acid-soluble and acid-insoluble fractions. Thousands of organic compounds are found in the soluble pool. Techniques are used to isolate and analyze these compounds to determine their structure and function. Burning tissues reveals inorganic elements as ash.',
      },
      {
        title: 'Inorganic Elements In Living Tissues',
        content: 'Inorganic elements like sodium, calcium, magnesium, and phosphate are present in tissues. These are found both in ash after burning tissues and in the acid-soluble pool. Though not carbon-based, these elements are essential for physiological functions and are included in the overall chemical composition of living organisms.',
      },
      {
        title: 'Amino Acids',
        content: 'Amino acids are α-substituted methanes with a carboxyl, amino, hydrogen, and variable R group. They are building blocks of proteins and vary based on R groups. There are 20 protein-forming amino acids, categorized as acidic, basic, neutral, or aromatic. Their ionizable groups make them responsive to pH changes.',
      },
      {
        title: 'Lipids',
        content: 'Lipids are water-insoluble compounds including fatty acids and glycerol-based molecules. Fatty acids may be saturated or unsaturated and can form mono-, di-, or triglycerides. Lipids like oils and fats differ in melting points. Phospholipids like lecithin are vital for membranes, and complex lipids are found in neural tissues.',
      },
      {
        title: 'Nucleotides And Nucleic Acids',
        content: 'Nucleotides are composed of a nitrogen base, sugar, and phosphate group. Nitrogen bases include adenine, guanine, cytosine, uracil, and thymine. Nucleosides are nitrogen bases with sugar, and nucleotides include a phosphate. DNA and RNA are polymers of nucleotides and function as genetic material in living organisms.',
      },
      {
        title: 'Biomacromolecules',
        content: 'Biomacromolecules are large organic compounds like proteins, nucleic acids, polysaccharides, and lipids found in the acid-insoluble fraction of cells. Except lipids, they are polymeric and have molecular weights above 10,000 Da. Lipids, though smaller, are included due to their membrane-bound insolubility. Together with micromolecules, they represent the complete chemical composition of living tissues.',
      },
      {
        title: 'Micromolecules',
        content: 'Micromolecules are small biomolecules with molecular weights less than 1,000 Da. They are found in the acid-soluble fraction of cells and include substances like amino acids, sugars, nucleotides, and vitamins. These compounds are typically involved in primary metabolism and represent the cytoplasmic composition of living cells.',
      },
      {
        title: 'Lipids in Macromolecular Fraction',
        content: 'Lipids have low molecular weights but are part of the macromolecular fraction due to their structural roles in membranes. When cells are disrupted, membrane fragments form insoluble vesicles that settle with the acid-insoluble pool. Though not polymeric, their physical properties cause them to be grouped with macromolecules.',
      },
      {
        title: 'Chemical Composition of Living Cells',
        content: 'Living cells are mostly composed of water (70-90%), followed by proteins (10-15%), nucleic acids (5-7%), carbohydrates (3%), lipids (2%), and ions (1%). This composition includes both soluble and insoluble cellular components, representing the entire biochemical makeup of a living organism.',
      },
      {
        title: 'Proteins',
        content: 'Proteins are polypeptides made of amino acids linked by peptide bonds. Each protein is a heteropolymer of 20 different amino acids. Some amino acids are essential and must be obtained through diet, while others are synthesized by the body. Proteins perform various roles like enzymes, hormones, transporters, antibodies, and structural components.',
      },
      {
        title: 'Types and Functions of Proteins',
        content: 'Proteins serve many functions in living organisms. Collagen acts as intercellular ground substance, trypsin is an enzyme, insulin functions as a hormone, antibodies fight infections, receptors aid in sensory reception, and GLUT-4 transports glucose into cells. RuBisCO is the most abundant protein in the biosphere, while collagen is most abundant in animals.',
      },
      {
        title: 'Polysaccharides',
        content: 'Polysaccharides are macromolecules made of long sugar chains and are found in the acid insoluble fraction. Cellulose is a homopolymer of glucose in plant cell walls. Starch stores energy in plants and forms helical structures, turning blue with iodine. Glycogen is the animal form. Inulin is made of fructose. Chitin, found in arthropods, is a complex polysaccharide.',
      },
      {
        title: 'Nucleic acids',
        content: 'Nucleic acids are macromolecules found in the acid-insoluble fraction of living tissues. They are polynucleotides, forming a part of the macromolecular group along with polysaccharides and polypeptides. Each nucleotide consists of a nitrogenous base, a sugar, and a phosphate group. The nitrogenous bases include adenine, guanine, cytosine, thymine, and uracil.',
      },
      {
        title: 'Nitrogenous bases and sugar types',
        content: 'Nitrogenous bases are of two types: purines (adenine and guanine) and pyrimidines (cytosine, thymine, and uracil). The sugar in nucleotides is either ribose or deoxyribose. Nucleic acids with ribose are called RNA, and those with deoxyribose are DNA. These components form the structural basis of nucleic acid molecules.',
      },
      {
        title: 'Structure Of Proteins',
        content: 'Proteins are heteropolymers of amino acids. Their structure is described at four levels: primary (sequence of amino acids), secondary (helical or folded regions), tertiary (3D folded shape necessary for biological function), and quaternary (arrangement of multiple subunits). For example, haemoglobin has a quaternary structure with two α and two β subunits.',
      },
      {
        title: 'Enzymes',
        content: 'Enzymes are mostly proteins, though some RNA molecules act as ribozymes. They have a specific three-dimensional structure with an active site where the substrate binds. Unlike inorganic catalysts, enzymes work efficiently at body temperature but are sensitive to heat. Enzymes from thermophilic organisms can function even at high temperatures of 80°–90°C.',
      },
      {
        title: 'Chemical reactions',
        content: 'Chemical reactions involve breaking and forming bonds, unlike physical changes like melting. Enzymes accelerate chemical reactions dramatically. For instance, carbonic anhydrase increases the reaction rate from a few molecules per hour to 600,000 per second. Enzyme-catalysed reactions are central to metabolism and occur in defined metabolic pathways involving multiple enzymes.',
      },
      {
        title: 'Mechanism of enzyme action',
        content: 'Enzymes bind to a substrate at the active site forming an enzyme-substrate complex (ES). This leads to a transition state, followed by product formation and release. Enzymes lower the activation energy needed to convert substrate to product, enabling faster reactions. The ES complex is transient, and enzymes remain unchanged after the reaction.',
      },
      {
        title: 'Catalytic cycle',
        content: 'The catalytic cycle includes substrate binding, enzyme conformational change, bond breaking/forming, and product release. The enzyme then repeats the process with new substrate molecules. This efficient reuse makes enzymes highly effective biological catalysts capable of sustaining metabolic processes repeatedly and rapidly.',
      },
      {
        title: 'Factors affecting enzyme activity',
        content: 'Enzyme activity is influenced by temperature, pH, and substrate concentration. Each enzyme has an optimum temperature and pH. High temperatures denature enzymes, while low ones inactivate them temporarily. Increasing substrate concentration raises the reaction rate until enzyme saturation is reached, after which velocity remains constant (Vmax).',
      },
      {
        title: 'Enzyme inhibition',
        content: 'Enzymes may be inhibited by chemicals. A competitive inhibitor resembles the substrate and competes for the active site, reducing enzyme activity. For example, malonate inhibits succinic dehydrogenase. Inhibitors are often used in medicine to control bacterial infections by targeting specific enzymes.',
      },
      {
        title: 'Classification and nomenclature of enzymes',
        content: 'Enzymes are classified into six types based on the reaction they catalyse: oxidoreductases, transferases, hydrolases, lyases, isomerases, and ligases. Each class has further subgroups and a unique four-digit number for identification. These enzymes regulate a wide range of biological processes and metabolic pathways.',
      },
      {
        title: 'Co-factors',
        content: 'Many enzymes require non-protein cofactors to function. These include prosthetic groups (tightly bound), coenzymes (loosely associated, often vitamins like NAD/NADP), and metal ions (e.g., zinc in carboxypeptidase). The protein part is called an apoenzyme. Without its cofactor, an enzyme becomes inactive, proving their crucial role in catalysis.',
      },
    ],
  },

  'Cell Cycle and Cell Division': {
    intro: 'Cell cycle, mitosis, meiosis and their significance.',
    sections: [
      {
        title: 'Cell cycle and cell division',
        content: 'All organisms begin life from a single cell that divides to form a large number of cells through repeated cycles of growth and division. Each parental cell divides into two daughter cells, which can further grow and divide, forming a large multicellular organism. Growth and reproduction are essential features of all living cells.',
      },
      {
        title: 'Cell cycle',
        content: 'The cell cycle is the sequence of events by which a cell grows, duplicates its genome, and divides into two daughter cells. DNA replication and cell growth must be coordinated for accurate genome transfer. While cell growth is continuous, DNA synthesis occurs during a specific stage, and all events are genetically controlled.',
      },
      {
        title: 'Phases of cell cycle',
        content: 'The cell cycle in eukaryotes includes two phases: Interphase and M phase. Interphase is the preparatory phase and takes up over 95% of the cycle, while M phase includes actual division. M phase starts with karyokinesis followed by cytokinesis. The average cell cycle duration is about 24 hours in humans.',
      },
      {
        title: 'Interphase',
        content: 'Interphase is divided into G1, S, and G2 phases. G1 involves metabolic activity and growth without DNA replication. S phase is when DNA replication occurs, doubling DNA content without changing chromosome number. G2 involves further growth and synthesis of proteins in preparation for mitosis.',
      },
      {
        title: 'Quiescent stage (G0)',
        content: 'Cells that no longer divide enter G0 from G1. These cells remain metabolically active but do not proliferate unless required. Many adult animal cells like heart cells enter this phase. In animals, mitosis generally occurs in diploid somatic cells, while in plants, it can occur in both haploid and diploid cells.',
      },
      {
        title: 'M Phase',
        content: 'M phase is the most dramatic phase of the cell cycle, marked by major reorganisation of cell components. It is called equational division as chromosome number remains unchanged. Mitosis includes four continuous stages of nuclear division: prophase, metaphase, anaphase, and telophase, collectively called karyokinesis, followed by cytokinesis for cytoplasmic division.',
      },
      {
        title: 'Prophase',
        content: 'Prophase begins after the S and G2 phases. Chromatin condenses into visible chromosomes with sister chromatids joined at the centromere. Centrosomes move to opposite poles forming the mitotic apparatus with asters and spindle fibres. Golgi complexes, ER, nucleolus, and nuclear envelope disappear by the end of prophase.',
      },
      {
        title: 'Metaphase',
        content: 'In metaphase, the nuclear envelope disintegrates and chromosomes align at the cell equator. Each chromosome consists of two sister chromatids connected at the centromere with kinetochores. Spindle fibres attach to kinetochores, guiding chromosomes to align along the metaphase plate for equal segregation.',
      },
      {
        title: 'Anaphase',
        content: 'Anaphase starts when centromeres split simultaneously and sister chromatids become daughter chromosomes. They are pulled towards opposite poles with centromeres leading and arms trailing. This ensures that each pole receives an identical set of chromosomes for the future daughter cells.',
      },
      {
        title: 'Telophase',
        content: 'During telophase, chromosomes reach the poles, decondense, and lose individuality. Nuclear envelopes reappear around chromosome sets forming two daughter nuclei. Nucleolus, Golgi complex, and endoplasmic reticulum reassemble, completing nuclear division and preparing for cytoplasmic division.',
      },
      {
        title: 'Cytokinesis',
        content: 'Cytokinesis follows karyokinesis and divides the cytoplasm to form two daughter cells. In animal cells, a cleavage furrow forms and deepens to split the cell. In plant cells, a cell plate forms in the center and expands outward to form the new cell wall. Organelles are distributed between daughter cells.',
      },
      {
        title: 'Definition And Occurrence',
        content: 'Mitosis is an equational division mostly seen in diploid cells. However, in some lower plants and social insects, even haploid cells can undergo mitosis. This process is crucial for producing diploid daughter cells that are genetically identical to the parent cell.',
      },
      {
        title: 'Role In Growth',
        content: 'The growth of multicellular organisms occurs through mitosis. As cells grow, the balance between the nucleus and cytoplasm gets disturbed, prompting cell division to restore the nucleo-cytoplasmic ratio and maintain proper cell function.',
      },
      {
        title: 'Cell Repair And Replacement',
        content: 'Mitosis plays a key role in repairing and replacing damaged cells. Cells in the epidermis, gut lining, and blood are regularly replaced through mitosis to maintain tissue function and integrity.',
      },
      {
        title: 'Plant Growth',
        content: 'In plants, mitotic division in meristematic tissues like the apical and lateral cambium leads to continuous growth throughout the plant’s life, supporting both lengthwise and girth expansion.',
      },
      {
        title: 'Meiosis',
        content: 'Meiosis is a special type of cell division in sexually reproducing organisms that reduces the chromosome number by half, forming haploid gametes. It involves two sequential divisions—meiosis I and meiosis II—but only one DNA replication. It ensures genetic diversity and restores diploid number upon fertilisation, maintaining chromosome stability across generations.',
      },
      {
        title: 'Prophase I',
        content: 'Prophase I is the longest meiotic stage and is divided into five sub-stages: leptotene, zygotene, pachytene, diplotene, and diakinesis. Homologous chromosomes pair, undergo synapsis, and exchange genetic material via crossing over. This leads to recombination and genetic variation. By diakinesis, chromosomes condense fully and the spindle begins to form.',
      },
      {
        title: 'Metaphase I',
        content: 'In metaphase I, bivalent chromosomes align at the equatorial plate of the cell. Spindle fibres from opposite poles attach to the kinetochores of homologous chromosomes, preparing them for separation in the next stage.',
      },
      {
        title: 'Anaphase I',
        content: 'During anaphase I, homologous chromosomes separate and move toward opposite poles of the cell. However, sister chromatids remain attached at their centromeres. This results in the reduction of chromosome number by half.',
      },
      {
        title: 'Prophase II',
        content: 'Prophase II starts after interkinesis. Chromosomes re-condense and the nuclear envelope disappears again. Unlike prophase I, it is a simpler phase and prepares cells for the second meiotic division, which is similar to mitosis.',
      },
      {
        title: 'Metaphase II',
        content: 'In metaphase II, chromosomes align at the equator. Spindle fibres from opposite poles attach to the kinetochores of each sister chromatid, preparing them for separation into individual chromatids.',
      },
      {
        title: 'Anaphase II',
        content: 'Anaphase II begins with the splitting of centromeres. Sister chromatids, now individual chromosomes, move to opposite poles of the cell due to shortening of spindle fibres. This results in four genetically distinct haploid cells.',
      },
      {
        title: 'Significance Of Meiosis',
        content: 'Meiosis ensures the maintenance of a constant chromosome number across generations in sexually reproducing organisms by halving the chromosome number in gametes. It also promotes genetic variation among offspring, which is essential for natural selection and evolution. These variations contribute to the adaptability and diversity of life on Earth.',
      },
    ],
  },

  'Photosynthesis in Higher Plants': {
    intro: 'Light and dark reactions, photophosphorylation and C3/C4 pathways.',
    sections: [
      {
        title: 'Photosynthesis In Higher Plants',
        content: 'Green plants are autotrophs that prepare their own food through photosynthesis using sunlight, CO₂, and water. This process is vital as it forms the base of the food chain and releases oxygen. All life on Earth depends on this conversion of light energy to chemical energy, making photosynthesis essential for survival.',
      },
      {
        title: 'Priestley’s Experiment',
        content: 'Joseph Priestley discovered oxygen and showed that plants restore air damaged by animals or candles. He placed a mint plant in a closed jar with a burning candle and a mouse. The plant allowed the candle to keep burning and the mouse to survive, proving plants purify the air.',
      },
      {
        title: 'Ingenhousz’s Observation',
        content: 'Jan Ingenhousz demonstrated that sunlight is essential for plants to purify air. He observed oxygen bubbles forming around green parts of aquatic plants in sunlight, but not in darkness. This proved that only green parts release oxygen and that light is necessary for this process.',
      },
      {
        title: 'Sachs’ Contribution',
        content: 'Julius von Sachs showed that glucose is produced in green parts of plants and is stored as starch. He proved that chlorophyll is located in chloroplasts, which are responsible for glucose synthesis during photosynthesis.',
      },
      {
        title: 'Engelmann’s Action Spectrum',
        content: 'T.W. Engelmann used a prism and Cladophora algae with aerobic bacteria to identify the action spectrum of photosynthesis. He observed most oxygen evolution (bacteria accumulation) in red and blue light, showing that these wavelengths are most effective for photosynthesis, similar to the absorption spectra of chlorophyll.',
      },
      {
        title: 'Van Niel’s Hypothesis',
        content: 'Cornelius van Niel proposed that photosynthesis involves light-driven reduction of CO₂ using hydrogen from an oxidisable compound. In green plants, water is the hydrogen donor, releasing oxygen. In other organisms like green sulfur bacteria, hydrogen sulfide is used, releasing sulfur or sulfate instead of oxygen.',
      },
      {
        title: 'Modern Understanding Of Photosynthesis',
        content: 'The correct photosynthesis equation shows that oxygen released comes from water, not carbon dioxide. This was proven using radioisotopes. The process is multi-step and not a single reaction. The use of 12 water molecules ensures enough hydrogen for glucose formation and releases oxygen as a by-product.',
      },
      {
        title: 'Site Of Photosynthesis',
        content: 'Photosynthesis occurs mainly in green leaves but also in other green parts of the plant. It primarily takes place in the mesophyll cells of leaves, which contain many chloroplasts. These chloroplasts align themselves to receive optimum light. Other green parts like young stems and sepals can also carry out photosynthesis.',
      },
      {
        title: 'Structure Of Chloroplast',
        content: 'Chloroplasts have a complex internal structure with a membrane system that includes grana, stroma lamellae, and the fluid-filled stroma. The grana trap light energy and help form ATP and NADPH, while the stroma contains enzymes that use these products to synthesize sugars, which later form starch.',
      },
      {
        title: 'Light And Dark Reactions',
        content: 'Photosynthesis involves two main reactions. Light reactions occur in the membrane system and produce ATP and NADPH using light energy. Dark reactions take place in the stroma and synthesize sugar using the products of light reactions. Though called dark reactions, they depend on light indirectly and do not occur in darkness.',
      },
      {
        title: 'Types of pigments in photosynthesis',
        content: 'There are four main pigments involved in photosynthesis: chlorophyll a (blue-green), chlorophyll b (yellow-green), xanthophylls (yellow), and carotenoids (yellow to orange). These pigments are found in varying amounts in different plants, giving rise to different shades of green. Pigments absorb light at specific wavelengths, aiding in the photosynthesis process.',
      },
      {
        title: 'Role of chlorophyll a',
        content: 'Chlorophyll a is the most abundant and important pigment in photosynthesis. It shows maximum light absorption in the blue and red regions of the visible spectrum. These are also the regions where the rate of photosynthesis is highest. Thus, chlorophyll a is considered the chief pigment responsible for trapping light energy.',
      },
      {
        title: 'Action spectrum and absorption spectrum',
        content: 'The action spectrum of photosynthesis closely matches the absorption spectrum of chlorophyll a, especially in the red and blue regions. However, there is no complete overlap, indicating the involvement of other pigments in capturing light and contributing to photosynthesis beyond the peaks of chlorophyll a.',
      },
      {
        title: 'Function of accessory pigments',
        content: 'Accessory pigments such as chlorophyll b, xanthophylls, and carotenoids help expand the range of light wavelengths that can be used in photosynthesis. They absorb light and transfer the energy to chlorophyll a. Additionally, they protect chlorophyll a from damage by photo-oxidation, ensuring efficient functioning of photosynthesis.',
      },
      {
        title: 'Light reaction',
        content: 'Light reaction, also known as the photochemical phase, involves light absorption, water splitting, oxygen release, and the formation of ATP and NADPH. It occurs in the thylakoid membranes where pigments are organized into two photosystems, PS I and PS II, each with light harvesting complexes and a unique chlorophyll a reaction centre.',
      },
      {
        title: 'Light harvesting complex',
        content: 'Light harvesting complexes (LHCs) are groups of pigment molecules bound to proteins, found in PS I and PS II. These act as antennae, capturing light of various wavelengths to enhance photosynthesis. All pigments except one chlorophyll a molecule form the antenna, while the lone chlorophyll a serves as the reaction centre.',
      },
      {
        title: 'Photosystem I and II',
        content: 'PS I and PS II differ in their reaction centre chlorophyll a. In PS I, chlorophyll a absorbs light at 700 nm and is called P700. In PS II, it absorbs at 680 nm and is called P680. These systems were named in the order of discovery, not the order of function in the light reaction.',
      },
      {
        title: 'Electron transport',
        content: 'In PS II, chlorophyll a absorbs red light (680 nm), exciting electrons that move through an electron transport chain to PS I. PS I absorbs 700 nm light, further exciting electrons, which reduce NADP+ to NADPH + H+. This flow, called the Z scheme, illustrates electron movement through redox reactions, linking both photosystems.',
      },
      {
        title: 'Splitting of water',
        content: 'PS II replaces lost electrons through photolysis of water, producing electrons, protons (H+), and oxygen. This occurs on the inner side of the thylakoid membrane. The released electrons replenish PS II, protons accumulate in the lumen, and O2 is released as a byproduct of photosynthesis, contributing to the atmospheric oxygen.',
      },
      {
        title: 'Cyclic and non-cyclic photophosphorylation',
        content: 'Non-cyclic photophosphorylation involves both PS II and PS I, producing ATP and NADPH. In cyclic photophosphorylation, only PS I functions, and electrons cycle back to PS I, generating ATP only. This occurs in stroma lamellae, which lack PS II and NADP reductase, and happens under light >680 nm wavelength.',
      },
      {
        title: 'Chemiosmotic hypothesis',
        content: 'ATP synthesis in chloroplasts occurs via chemiosmosis. Water splitting, electron transport, and NADP+ reduction create a proton gradient across the thylakoid membrane. Protons accumulate in the lumen and move back to the stroma through ATP synthase, powering ATP formation. This gradient-driven mechanism mirrors mitochondrial ATP synthesis in respiration.',
      },
      {
        title: 'ATP synthase structure and function',
        content: 'ATP synthase consists of two parts: CF0 embedded in the thylakoid membrane forms a channel for protons, and CF1 faces the stroma and synthesizes ATP. Proton movement through CF0 releases energy, changing CF1\'s shape and enabling ATP production. This energy is crucial for the Calvin cycle and sugar synthesis.',
      },
      {
        title: 'Use of ATP and NADPH',
        content: 'ATP and NADPH produced in the light reaction are used in the biosynthetic phase of photosynthesis to convert CO2 and H2O into sugars. This phase continues briefly after light is removed but stops once ATP and NADPH are used up. Thus, calling it a “dark reaction” is misleading, as it depends on light-derived products.',
      },
      {
        title: 'Discovery of the first CO2 fixation product',
        content: 'Melvin Calvin used radioactive 14C to trace CO2 fixation and found that the first stable product in many plants was a 3-carbon compound, PGA. Later, in other plants, a 4-carbon compound, OAA, was identified. These discoveries led to classification into C3 and C4 pathways, based on the first CO2 fixation product.',
      },
      {
        title: 'Primary acceptor of CO2',
        content: 'The CO2 acceptor in the Calvin cycle is a 5-carbon sugar called ribulose bisphosphate (RuBP). This was surprising since scientists initially expected a 2-carbon molecule. RuBP reacts with CO2 to form two molecules of PGA, a 3-carbon compound, during the carboxylation stage of the Calvin cycle.',
      },
      {
        title: 'Calvin cycle overview',
        content: 'The Calvin cycle occurs in all photosynthetic plants and includes three stages: carboxylation, reduction, and regeneration. It uses ATP and NADPH from the light reactions. For one glucose molecule, the cycle must turn six times, consuming 18 ATP and 12 NADPH, and regenerating RuBP to continue the cycle.',
      },
      {
        title: 'Carboxylation stage',
        content: 'Carboxylation is the first step of the Calvin cycle, where CO2 is fixed to RuBP to form two molecules of PGA. This reaction is catalyzed by RuBisCO, which has both carboxylase and oxygenase activity. It is the key step that incorporates inorganic carbon into an organic form.',
      },
      {
        title: 'Reduction stage',
        content: 'In the reduction phase, PGA is converted into carbohydrates using 2 ATP and 2 NADPH per CO2 molecule fixed. A total of 6 CO2 molecules are required to synthesize one glucose molecule, meaning 12 NADPH and 12 ATP are used in this stage alone, leading to sugar formation.',
      },
      {
        title: 'Regeneration stage',
        content: 'The regeneration stage replenishes RuBP, the CO2 acceptor, to sustain the Calvin cycle. This step requires 6 ATP molecules per glucose formed. Without RuBP regeneration, the cycle cannot continue. Overall, synthesizing one glucose requires 18 ATP and 12 NADPH, explaining the role of cyclic photophosphorylation for extra ATP.',
      },
      {
        title: 'Photorespiration',
        content: 'Photorespiration occurs when RuBisCO binds with O2 instead of CO2, forming phosphoglycerate and phosphoglycolate. This process happens in C3 plants and results in the release of CO2 without producing ATP or NADPH. C4 plants avoid photorespiration by concentrating CO2 around RuBisCO in bundle sheath cells, enhancing efficiency and productivity under high temperature and light.',
      },
      {
        title: 'Comparison Of C3 And C4 Plants',
        content: 'C3 plants fix CO2 in mesophyll cells using RuBP as the primary acceptor, producing a 3-carbon PGA. C4 plants fix CO2 first in mesophyll cells using PEP, forming a 4-carbon OAA, and complete the Calvin cycle in bundle sheath cells. C4 plants have higher photosynthetic efficiency and negligible photorespiration, especially under high light and temperature.',
      },
      {
        title: 'C4 Pathway',
        content: 'C4 plants are adapted to hot, dry environments and show high productivity. They have Kranz anatomy with bundle sheath cells rich in chloroplasts. CO2 is first fixed in mesophyll cells by PEPcase to form OAA, which is converted to malate/aspartate and transported to bundle sheath cells. CO2 is released there and enters the Calvin cycle.',
      },
      {
        title: 'Kranz Anatomy',
        content: 'C4 plants possess Kranz anatomy, where bundle sheath cells form a wreath-like arrangement around vascular bundles. These cells are large, tightly packed, rich in chloroplasts, and have thick walls. This structure helps concentrate CO2, prevents photorespiration, and enhances efficiency of the Calvin cycle, which occurs exclusively in bundle sheath cells of C4 plants.',
      },
      {
        title: 'Factors Affecting Photosynthesis',
        content: 'Photosynthesis is influenced by both internal and external factors. Internal factors include leaf characteristics, chlorophyll content, and internal CO2 levels. External factors include light, temperature, CO2 concentration, and water. The rate is determined by the limiting factor present in minimal amount, as stated in Blackman’s Law of Limiting Factors.',
      },
      {
        title: 'Light',
        content: 'Light affects photosynthesis based on its quality, intensity, and duration. At low light intensities, photosynthesis increases with light. However, at high intensities, the rate plateaus as other factors become limiting. Light saturation occurs at only 10% of full sunlight. Excessive light can degrade chlorophyll and reduce photosynthetic activity.',
      },
      {
        title: 'Carbon Dioxide Concentration',
        content: 'CO2 is a major limiting factor in photosynthesis. Its atmospheric concentration is low but increasing it to 0.05% enhances CO2 fixation. C3 plants show saturation at lower CO2 levels than C4 plants. In greenhouses, CO2 enrichment increases productivity in crops like tomatoes and bell peppers by enhancing photosynthesis.',
      },
      {
        title: 'Temperature',
        content: 'Temperature mainly affects dark reactions due to enzyme activity. C4 plants thrive at higher temperatures, while C3 plants have lower optimums. The temperature optimum varies by habitat; tropical plants prefer higher temperatures than temperate ones. Light reactions are temperature-sensitive too, but to a lesser extent than dark reactions.',
      },
      {
        title: 'Water',
        content: 'Water indirectly affects photosynthesis by influencing plant physiology. Water stress leads to stomatal closure, reducing CO2 intake. It also causes leaf wilting, lowering surface area and metabolic activity. Though water is a reactant in light reactions, its main impact is through limiting gas exchange and leaf function.',
      },
    ],
  },

  'Respiration in Plants': {
    intro: 'Glycolysis, Krebs cycle, electron transport and respiratory quotient.',
    sections: [
      {
        title: 'Importance Of Respiration In Plants',
        content: 'Respiration in plants is vital as it releases energy from food for all life processes like transport, growth, and reproduction. This energy is extracted by oxidising food molecules such as glucose, with the energy stored in ATP. ATP then fuels cellular activities, making it the energy currency of the cell.',
      },
      {
        title: 'Source Of Energy In Living Organisms',
        content: 'All living organisms derive energy by oxidising macromolecules called food. Green plants make their own food via photosynthesis, while animals and fungi depend on others. Regardless of source, all food that fuels respiration ultimately originates from photosynthesis in green plants.',
      },
      {
        title: 'Cellular Respiration',
        content: 'Cellular respiration is the process by which food is broken down within cells to release energy. This occurs in the cytoplasm and mitochondria and involves slow, enzyme-controlled steps. The energy released is trapped in ATP molecules, which are then used to power various cellular functions.',
      },
      {
        title: 'Respiratory Substrates',
        content: 'Carbohydrates are the most common respiratory substrates. However, proteins, fats, and organic acids can also be oxidised in some plants under specific conditions. These substrates undergo controlled oxidation, releasing energy for ATP synthesis and providing carbon skeletons for biosynthesis.',
      },
      {
        title: 'Do Plants Breathe',
        content: 'Plants do respire but lack specialised respiratory organs. Instead, gas exchange occurs through stomata and lenticels. Each plant part manages its own gas needs, and respiration rates are lower than in animals. Diffusion suffices because living cells are usually close to the plant surface.',
      },
      {
        title: 'Adaptations For Gas Exchange In Plants',
        content: 'Leaves, stems, and roots have loosely packed parenchyma that create air spaces for efficient gas exchange. In woody stems, living cells lie near lenticels under the bark. Even large plants ensure that most living cells have contact with air, enabling sufficient oxygen diffusion for respiration.',
      },
      {
        title: 'Controlled Glucose Oxidation',
        content: 'Plants oxidise glucose in small, enzyme-regulated steps rather than all at once. This allows energy to be gradually released and captured in ATP rather than lost as heat. This strategy ensures efficient energy use in synthesising molecules needed for growth and metabolism.',
      },
      {
        title: 'Anaerobic Conditions And Glycolysis',
        content: 'Some organisms live without oxygen and can partially oxidise glucose anaerobically. Early life forms on Earth evolved in oxygen-free environments. Many present-day organisms retain glycolytic pathways to break down glucose into pyruvic acid even in the absence of oxygen.',
      },
      {
        title: 'Definition Of Glycolysis',
        content: 'Glycolysis is the breakdown of glucose into two molecules of pyruvic acid through a series of reactions. The term comes from Greek words: glycos (sugar) and lysis (splitting). It was explained by Embden, Meyerhof, and Parnas and is called the EMP pathway.',
      },
      {
        title: 'Occurrence Of Glycolysis',
        content: 'Glycolysis occurs in the cytoplasm of all living organisms. It is the only process of respiration in anaerobic organisms. It involves the partial oxidation of glucose into pyruvic acid and functions in both plants and animals.',
      },
      {
        title: 'Source Of Glucose In Plants',
        content: 'In plants, glucose enters glycolysis after being obtained from sucrose, which is the photosynthesis product. Sucrose is broken down by invertase into glucose and fructose, which are then phosphorylated and enter the glycolytic pathway.',
      },
      {
        title: 'Initial Steps Of Glycolysis',
        content: 'Glucose and fructose are phosphorylated by hexokinase to form glucose-6-phosphate. This then isomerises to form fructose-6-phosphate. Both sugars follow the same metabolic steps after phosphorylation.',
      },
      {
        title: 'Reactions In Glycolysis',
        content: 'Glycolysis involves ten enzyme-controlled reactions that convert glucose into pyruvate. ATP is used in two steps: formation of glucose-6-phosphate and fructose-1,6-bisphosphate. One NADH + H+ is formed when PGAL is converted to BPGA.',
      },
      {
        title: 'ATP Formation In Glycolysis',
        content: 'ATP is synthesised when BPGA is converted to PGA and also when PEP converts to pyruvic acid. In total, glycolysis yields a net gain of two ATP molecules per glucose molecule directly.',
      },
      {
        title: 'Fermentation',
        content: 'Fermentation occurs in anaerobic conditions in many prokaryotes and unicellular eukaryotes. It allows energy production without oxygen by converting pyruvate to lactic acid or ethanol and CO2.',
      },
      {
        title: 'Aerobic Respiration',
        content: 'For complete glucose oxidation to CO2 and H2O, cells use aerobic respiration through the Krebs\' cycle, which requires the presence of oxygen for further breakdown of pyruvate.',
      },
      {
        title: 'Fermentation process',
        content: 'Fermentation involves incomplete glucose oxidation under anaerobic conditions. In yeast, pyruvic acid is converted to ethanol and CO2 by enzymes like pyruvic acid decarboxylase and alcohol dehydrogenase. In some bacteria and muscle cells, pyruvic acid forms lactic acid. NADH is oxidised to NAD+ in both processes. Energy release is low, under 7% of glucose’s total energy.',
      },
      {
        title: 'ATP yield in fermentation',
        content: 'Fermentation of one glucose molecule yields a net gain of 2 ATP after subtracting ATP used during glycolysis. It is much less efficient than aerobic respiration. Most of the glucose\'s energy remains unused in the form of ethanol or lactic acid. Thus, fermentation is not a major ATP-generating pathway in cells requiring high energy.',
      },
      {
        title: 'Toxicity of alcohol in yeast',
        content: 'Yeast can tolerate alcohol only up to a concentration of around 13%. Beyond this, ethanol becomes toxic, leading to yeast cell death. Therefore, beverages made by natural fermentation cannot exceed this limit. Alcoholic beverages with higher concentrations are produced through processes like distillation, which separates alcohol from the fermented mixture.',
      },
      {
        title: 'Aerobic respiration',
        content: 'Aerobic respiration is the complete oxidation of glucose in the presence of oxygen, producing CO2, water, and large amounts of energy. This process occurs in mitochondria of eukaryotic cells. It allows maximum energy extraction from glucose and supports energy demands of complex organisms, unlike fermentation which is less efficient and anaerobic.',
      },
      {
        title: 'Aerobic respiration',
        content: 'Aerobic respiration starts with pyruvate from glycolysis entering the mitochondria. Pyruvate undergoes oxidative decarboxylation by pyruvic dehydrogenase, forming acetyl CoA and NADH. Acetyl CoA enters the Krebs cycle for complete oxidation. This process generates CO2 and high-energy molecules (NADH, FADH2), which are used in the next stage to produce ATP.',
      },
      {
        title: 'Tricarboxylic acid cycle',
        content: 'The TCA cycle begins with acetyl CoA combining with oxaloacetic acid to form citric acid. It involves decarboxylation and oxidation steps that produce NADH, FADH2, and GTP (converted to ATP). The cycle regenerates oxaloacetic acid, allowing it to continue. This cycle produces the majority of reduced coenzymes used for ATP generation in the ETS.',
      },
      {
        title: 'Electron transport system and oxidative phosphorylation',
        content: 'NADH and FADH2 donate electrons to the electron transport system in the inner mitochondrial membrane. Electrons pass through complexes I–IV, ultimately reducing oxygen to water. This process releases energy that drives ATP synthesis via complex V (ATP synthase). NADH yields 3 ATP, FADH2 yields 2. Oxygen acts as the final hydrogen acceptor.',
      },
      {
        title: 'Chemiosmotic ATP synthesis',
        content: 'ATP synthase has two parts: F0 forms a proton channel and F1 synthesizes ATP. Protons pumped into the intermembrane space during electron transport flow back into the matrix through F0. This proton movement powers ATP synthesis at F1. Each ATP needs 4 protons, making oxidative phosphorylation highly efficient for energy production.',
      },
      {
        title: 'Respiratory balance sheet',
        content: 'Aerobic respiration theoretically yields 38 ATP from one glucose molecule, assuming a sequential process with complete glucose use and efficient NADH transfer. However, in living cells, pathways operate simultaneously with variable substrate input and usage. Thus, actual ATP production may differ, highlighting the complexity and efficiency of cellular respiration.',
      },
      {
        title: 'Fermentation vs aerobic respiration',
        content: 'Fermentation results in partial glucose breakdown, producing only 2 ATP per glucose molecule. In contrast, aerobic respiration fully oxidizes glucose to CO2 and H2O, yielding up to 38 ATP. NADH is oxidized slowly in fermentation but rapidly in aerobic respiration, making the latter significantly more energy-efficient and biologically advantageous.',
      },
      {
        title: 'Amphibolic nature of respiratory pathway',
        content: 'The respiratory pathway is not just catabolic but also serves anabolic roles. While glucose is the primary substrate, fats and proteins also enter the pathway at various stages. These same intermediates can be withdrawn to synthesize these molecules, making the pathway both catabolic and anabolic, and thus it is called an amphibolic pathway.',
      },
      {
        title: 'Entry of alternative substrates in respiration',
        content: 'Carbohydrates are converted to glucose for respiration. Fats break down into glycerol and fatty acids; glycerol enters as PGAL, and fatty acids as acetyl CoA. Proteins, after deamination, enter as pyruvate, acetyl CoA or into the Krebs\' cycle, depending on their structure. These various entry points show flexibility in substrate use in respiration.',
      },
      {
        title: 'Respiratory quotient',
        content: 'Respiratory quotient (RQ) is the ratio of the volume of CO2 released to the volume of O2 consumed during respiration. It indicates the nature of the respiratory substrate being used. RQ = CO2 evolved / O2 consumed. It helps in determining which type of biomolecule (carbohydrate, fat, or protein) is being oxidised.',
      },
      {
        title: 'RQ for carbohydrates',
        content: 'When carbohydrates are used as the respiratory substrate and are completely oxidised, equal volumes of CO2 and O2 are involved. Therefore, the respiratory quotient (RQ) is 1. This is considered the standard RQ value and indicates balanced oxygen consumption and carbon dioxide release during respiration.',
      },
      {
        title: 'RQ for fats',
        content: 'Fats require more oxygen for complete oxidation compared to the amount of carbon dioxide released. Hence, the RQ for fats is less than 1. For example, tripalmitin, a fatty acid, has an RQ value lower than 1, indicating high oxygen requirement and low CO2 output during respiration of fats.',
      },
      {
        title: 'RQ for proteins',
        content: 'When proteins are used as the respiratory substrate, the RQ is about 0.9. This value is slightly less than 1 because the oxidation of proteins produces less CO2 in comparison to the amount of oxygen consumed. However, proteins are rarely used as the sole substrate in living organisms.',
      },
    ],
  },

  'Plant Growth and Development': {
    intro: 'Growth phases, plant growth regulators, photoperiodism and vernalisation.',
    sections: [
      {
        title: 'Plant growth and development',
        content: 'Plant development is the orderly progression from a zygote to a mature plant, involving growth and differentiation. Growth begins with seed germination under favorable conditions. Development includes the formation of organs like roots, leaves, and flowers. It is influenced by internal and external factors and ends with senescence and death.',
      },
      {
        title: 'Growth',
        content: 'Growth is a permanent, irreversible increase in size and mass due to cell division and expansion. It involves metabolic processes and energy use. For example, the expansion of a leaf is true growth. Swelling due to water absorption is not considered growth as it’s not permanent or due to metabolism.',
      },
      {
        title: 'Plant growth generally is indeterminate',
        content: 'Plants grow continuously due to meristems, which are regions of active cell division. Apical meristems cause elongation (primary growth), while lateral meristems (like vascular cambium) contribute to girth increase (secondary growth). This type of ongoing cell addition makes plant growth open and indeterminate throughout their life.',
      },
      {
        title: 'Growth is measurable',
        content: 'Growth is measurable through parameters like fresh weight, dry weight, length, area, volume, and cell number. It reflects increases in protoplasm, cell size, or number. For example, maize roots produce thousands of cells per hour, while watermelon cells may expand many times their original size.',
      },
      {
        title: 'Phases of growth',
        content: 'Growth has three phases: meristematic (active cell division at root and shoot tips), elongation (cells enlarge and form vacuoles), and maturation (cells differentiate and attain final structure and function). These phases create functional plant tissues like xylem, phloem, and parenchyma.',
      },
      {
        title: 'Growth rates',
        content: 'Growth rate is the increase in plant size per unit time. It can be arithmetic, where one daughter cell divides and the other differentiates, leading to linear growth, or geometric, where both daughter cells divide, resulting in exponential or sigmoid growth. Growth rate indicates how efficiently a plant produces new material.',
      },
      {
        title: 'Conditions for growth',
        content: 'Growth requires water for turgor and enzyme activity, oxygen for energy release, and nutrients for building protoplasm. Temperature affects enzyme function, while environmental signals like light and gravity influence specific growth phases. Thus, internal and external conditions must be optimal for proper growth and development.',
      },
    ],
  },

  'Digestion and Absorption': {
    intro: 'Human digestive system, digestion, absorption and disorders.',
    sections: [
      {
        title: 'Digestion:',
        content: 'The process in alimentary canal by which the complex food is converted mechanically and biochemically into simple substances suitable for absorption and assimilation in the body of animals/organisms.',
      },
      {
        title: 'Food:',
        content: 'A substance which is taken and digested in the body to provide material for growth, repair & energy for reproduction and resistance from disease or regulation of body processes.',
      },
      {
        title: 'Thecodont:',
        content: 'The teeth embedded in the sockets of the jaw bone, e.g., in mammals.',
      },
      {
        title: 'Diphyodont:',
        content: 'The teeth formed twice in life time e.g., in mammals.',
      },
      {
        title: 'Heterodont:',
        content: 'Different types of teeth. An adult human has 32 permanent teeth which are of four different types.',
      },
      {
        title: 'Peristalsis:',
        content: 'The involuntary movement of the gut by which the food bolus is pushed forward.',
      },
      {
        title: 'Deglutition:',
        content: 'The process of swallowing of food bolus. It is partly voluntary and partly involuntary.',
      },
      {
        title: 'Ruminants:',
        content: 'The herbivours animals (e.g., cow, buffalo etc.) which have symbiotic bacteria in the rumen of their stomach, which synthesize enzymes to hydrolyse cellulose into monosaccharides.',
      },
      {
        title: 'Diarrhoea:',
        content: 'The abnormal frequent discharge of semisolid or fluid faecal matter from the bowel.',
      },
      {
        title: 'Vomiting:',
        content: 'The ejection of stomach contents through the mouth, caused by antiperistalsis.',
      },
      {
        title: 'Dysentery:',
        content: 'Frequent watery stools often with blood and mucus, along with pain and fever. Loss of water causes dehydration.',
      },
      {
        title: 'Chyme:',
        content: 'The semifluid mass, into which food is converted by gastric secretion, which passes from the stomach into the small intestine.',
      },
      {
        title: 'Gastric:',
        content: 'Anything associated with stomach is given a prefix ‘gastric’.',
      },
      {
        title: 'Proenzyme:',
        content: 'The inactive forms of enzymes.',
      },
      {
        title: 'Sphincter:',
        content: 'A flap like structure at various junctions of the alimentary canal which facilitates one way traffic (movement of material) in the alimentary canal.',
      },
      {
        title: 'Bolus:',
        content: 'The masticated food mixed with saliva.',
      },
      {
        title: 'Hepatic:',
        content: 'Anything associated with liver is given a prefix ‘hepatic’.',
      },
      {
        title: 'Goblet cells:',
        content: 'The cells of intestinal mucosal epithelium which secrete mucus.',
      },
      {
        title: 'Glisson’s capsule:',
        content: 'The connective tissue sheath which covers the hepatic lobules of liver.',
      },
      {
        title: 'Hepatic lobules:',
        content: 'The structural and functional units of liver containing hepatic cells which are arranged in the form of cords.',
      },
      {
        title: 'Sphincter of Oddi:',
        content: 'The sphincter which guard the opening of common hepatopancreatic duct.',
      },
      {
        title: 'Villi:',
        content: 'The small finger-like folding in the small intestine which increase the surface area for absorption of digested food.',
      },
      {
        title: 'Crypts of Lieberkuhn-',
        content: 'pits of intestine/tubular intestinal glands.',
      },
      {
        title: 'Succus entericus-',
        content: 'Intestinal juices, secreted in small intestine.',
      },
      {
        title: 'Calorific Value:',
        content: 'Amount of heat energy released by 1 gm of substrate after complete oxidation. Calorific value of Carbohydrates is 4.1 k.cal/g = 17.1 kj/g Protein is 5.6 kcal/g = 23.4 kj/gm Fats is 9.4 kcal/g (app.) = 39.2 kj/gm',
      },
    ],
  },

  'Breathing and Exchange of Gases': {
    intro: 'Respiratory organs, mechanism of breathing and gas transport.',
    sections: [
      {
        title: 'Breathing:',
        content: '(External respiration) The process of exchange of O 2 from the atmosphere with CO 2 produced by the cells.',
      },
      {
        title: 'Carbamino haemoglobin:',
        content: 'Compound formed in RBCs when CO 2 combine with haemoglobin.',
      },
      {
        title: 'Inspiration:',
        content: 'Oxygen from fresh air taken in by lungs and diffused into the blood.',
      },
      {
        title: 'Uncategorized',
        content: 'Expiration: CO 2 given up by venous blood in the lungs is sent out to exterior.',
      },
      {
        title: 'Respiration:',
        content: 'The sum total of physical and chemical processes by which oxygen and carbohydrates (main food nutrient) etc are assimilated into the system and the oxidation products like carbon dioxide and water are given off.',
      },
      {
        title: 'Diaphragm:',
        content: 'A muscular, membranous partition separating the thoracic cavity from the abdominal cavity.',
      },
      {
        title: 'Hypoxia-',
        content: 'Shortage of oxygen in tissues.',
      },
      {
        title: 'Partial Pressure-',
        content: 'The pressure contributed by an individual gas in a mixture of gases. It is represented as pO 2 for oxygen and pCO 2 for carbondioxide.',
      },
      {
        title: 'Pharynx:',
        content: 'The tube or cavity which connects the mouth and nasal passages with oesophagus. It has three parts (i) Nasopharynx (anterior part) (ii) Oropharynx (middle part) and (iii) Laryngopharynx (posterior part which continues to larynx)',
      },
      {
        title: 'Adam’s Apple:',
        content: 'The projection formed by the thyroid cartilage and surrounds the larynx at the front of the neck.',
      },
      {
        title: 'Tidal volume (TV):',
        content: 'Volume of air taken in/given out during normal respiration (500 mL.)',
      },
      {
        title: 'Inspiratory Reserve Volume (IRV):',
        content: 'Additional volume of air inspired by a forcible inspiration. 2500mL to 3000mL.',
      },
      {
        title: 'Expiratory Reserve Volume (ERV):',
        content: 'Additional volume of air, a person can expire by a forcible expiration.',
      },
      {
        title: 'Residual volume (RV):',
        content: 'Volume of air remaining in the lungs even after a forcible expiration (1100 mL to 1200 mL)',
      },
      {
        title: 'PULMONARY CAPACITIES:',
        content: 'Use in clinical diagnosis Inspiratory capacity (IC) = (TV + IRV) Total volume of air a person can inspire after a normal expiration. Expiratory Capacity- Total Volume of air a parson can expire after a normal inspiration E.C. = TV + ERV Functional Residual Capacity- Volume of air that will remain in lungs after a normal expiration (FRC) = (ERV + RV) Vital Capacity (VC) = (ERV + TV + IRV) or the maximum volume of air a person can breath out after a forced inspiration. Total Lung Capacity: It includes RV, ERV, TV and IRV or vital capacity + residual volume',
      },
      {
        title: 'Pulmonary-',
        content: 'Anything associated with the lungs is given the prefix ‘pulmonary’.',
      },
      {
        title: 'Uncategorized',
        content: 'Mechanism of breathing showing (a) Inspiration (b) Expiration',
      },
      {
        title: 'Respiratory Tract:',
        content: 'A pair of external nostrils ⟶ ⟶ nasal chamber through nasal passage ⟶ ⟶ pharynx ⟶ ⟶ glottis ⟶ ⟶ larynx ⟶ ⟶ trachea ⟶ ⟶ Left and right primary bronchi ⟶ ⟶ secondary and tertiary bronchi ⟶ ⟶ bronchioles ⟶ ⟶ vascularised bag like structures (alveoli) or air-sacs. Each lung is covered with double layered membrane known as pleura with pleural fluid between them.',
      },
      {
        title: 'Conditions required for (cutaneous respiration):',
        content: 'Skin should be moist and thin. It should be highly vascularised.',
      },
      {
        title: 'Physiology of Respiration: Exchange of gases-',
        content: 'Diffusion of gases takes place from the region of higher partial pressure to lower (lesser) partial pressure)',
      },
      {
        title: 'Physiology of Respiration: Transport of O2 by the blood-',
        content: 'Physiology of Respiration: Transport of O 2 by the blood-',
      },
      {
        title: 'Physiology of Respiration:',
        content: 'Transport of CO 2',
      },
      {
        title: 'Breathing and exchange of gases',
        content: 'Breathing is the process of exchanging oxygen and carbon dioxide between the body and the atmosphere. Oxygen is used to break down nutrients for energy, releasing carbon dioxide as a waste product. Continuous oxygen supply and carbon dioxide removal are essential. This gas exchange process is commonly referred to as respiration.',
      },
      {
        title: 'Respiratory organs',
        content: 'Different animals have different respiratory organs. Simple organisms use diffusion across their body surface. Earthworms use moist skin, insects use tracheae, aquatic animals use gills, and terrestrial animals use lungs. Amphibians like frogs can also breathe through their moist skin. In vertebrates, lungs are the main respiratory organs, except in fishes which use gills.',
      },
      {
        title: 'Human respiratory system',
        content: 'The human respiratory system starts from nostrils leading to nasal chamber, pharynx, larynx, trachea, bronchi, bronchioles, and ends in alveoli. Alveoli are thin, vascular structures where gas exchange occurs. Lungs are covered by pleural membranes and lie in the thoracic cavity.',
      },
      {
        title: 'Steps of respiration',
        content: 'Respiration involves five main steps: (i) breathing to move air in and out, (ii) diffusion of gases across alveoli, (iii) transport of gases by blood, (iv) diffusion between blood and tissues, and (v) use of oxygen in cells for metabolism and release of carbon dioxide as a waste product',
      },
      {
        title: 'Mechanism of breathing',
        content: 'Breathing includes inspiration and expiration, driven by pressure differences between lungs and atmosphere. Diaphragm and intercostal muscles contract to expand thoracic volume, reducing intrapulmonary pressure for air inflow (inspiration). Relaxation reverses the process, increasing pressure and pushing air out (expiration). Breathing rate averages 12–16 times/min. Spirometers assess lung function by measuring air volumes.',
      },
      {
        title: 'Tidal volume',
        content: 'Tidal volume is the amount of air inhaled or exhaled in a normal breath. It is approximately 500 mL in a healthy person, leading to a total of 6000–8000 mL of air exchanged per minute. This is the baseline volume used to calculate various pulmonary capacities.',
      },
      {
        title: 'Inspiratory reserve volume',
        content: 'Inspiratory reserve volume is the additional air a person can forcibly inhale after a normal inspiration. It averages between 2500 to 3000 mL. It reflects the lung’s capacity to take in extra air when needed, such as during physical activity.',
      },
      {
        title: 'Expiratory reserve volume',
        content: 'Expiratory reserve volume is the extra air that can be forcibly exhaled after a normal expiration. This value typically ranges between 1000 to 1100 mL and helps in assessing the strength and elasticity of the lungs during clinical diagnosis.',
      },
      {
        title: 'Residual volume',
        content: 'Residual volume is the air remaining in the lungs after maximum exhalation, preventing lung collapse. It ranges from 1100 to 1200 mL and cannot be measured directly by spirometry. It contributes to total lung capacity and functional residual capacity.',
      },
      {
        title: 'Inspiratory capacity',
        content: 'Inspiratory capacity is the maximum volume of air a person can inhale after normal expiration. It is the sum of tidal volume and inspiratory reserve volume (TV + IRV). It reflects the lung’s ability to expand for inhalation.',
      },
      {
        title: 'Expiratory capacity',
        content: 'Expiratory capacity is the total amount of air a person can exhale after a normal inspiration. It is the sum of tidal volume and expiratory reserve volume (TV + ERV) and is used to assess lung function in various respiratory conditions.',
      },
      {
        title: 'Functional residual capacity',
        content: 'Functional residual capacity is the amount of air left in the lungs after a normal expiration. It includes expiratory reserve volume and residual volume (ERV + RV). It helps keep the alveoli open and supports continuous gas exchange.',
      },
      {
        title: 'Vital capacity',
        content: 'Vital capacity is the maximum amount of air a person can exhale after a forceful inhalation or inhale after a forceful exhalation. It includes IRV, TV, and ERV. It is an important clinical measure of lung health and efficiency.',
      },
      {
        title: 'Total lung capacity',
        content: 'Total lung capacity is the total volume of air in the lungs after a forceful inspiration. It includes all four volumes: IRV, TV, ERV, and RV (or VC + RV). It represents the full functional capacity of the lungs.',
      },
      {
        title: 'Exchange of gases',
        content: 'Gaseous exchange occurs in alveoli and between blood and tissues through simple diffusion, driven by partial pressure gradients. Oxygen diffuses from alveoli to blood and tissues, while CO2 diffuses in the reverse direction. Factors like gas solubility, partial pressure, and membrane thickness influence diffusion. The diffusion membrane is very thin, favouring efficient gas exchange.',
      },
      {
        title: 'Partial pressures and diffusion',
        content: 'Oxygen moves from alveoli (pO2 104 mm Hg) to deoxygenated blood (40 mm Hg) and then to tissues (40 mm Hg). Carbon dioxide follows a reverse gradient from tissues (pCO2 45 mm Hg) to alveoli (40 mm Hg). CO2 diffuses more easily than O2 due to higher solubility, even with a smaller pressure difference, ensuring effective exchange.',
      },
      {
        title: 'Transport Of Gases',
        content: 'Blood transports oxygen and carbon dioxide. About 97% of oxygen is carried by RBCs as oxyhaemoglobin, and 3% is dissolved in plasma. Around 20–25% of carbon dioxide is transported by RBCs, 70% as bicarbonate in plasma, and 7% in dissolved form.',
      },
      {
        title: 'Transport of oxygen',
        content: 'About 97% of oxygen is transported by haemoglobin in RBCs as oxyhaemoglobin. Factors like pO2, pCO2, temperature, and H+ affect oxygen binding and release.',
      },
      {
        title: 'Transport of carbon dioxide',
        content: 'Carbon dioxide is transported as bicarbonate (70%), carbamino-haemoglobin (20–25%), and dissolved form (7%). Carbonic anhydrase in RBCs helps convert CO2 to bicarbonate and back for exchange at tissues and alveoli.',
      },
      {
        title: 'Regulation of respiration',
        content: 'Respiration is regulated by the respiratory rhythm centre in the medulla, which maintains breathing rhythm. The pneumotaxic centre in the pons moderates this rhythm by shortening inspiration. A chemosensitive area detects increased CO2 and H+ levels, prompting adjustments. Receptors in the aortic arch and carotid artery also sense these changes. Oxygen has minimal effect on regulation.',
      },
      {
        title: 'Asthma',
        content: 'Asthma is a respiratory disorder where the patient experiences difficulty in breathing accompanied by wheezing. It is caused due to inflammation of the bronchi and bronchioles, leading to narrowed airways. This condition affects the airflow and can be triggered by allergens, exercise, or cold air.',
      },
      {
        title: 'Emphysema',
        content: 'Emphysema is a chronic respiratory disease in which the alveolar walls are damaged, reducing the surface area for gas exchange. This results in decreased respiratory efficiency. A major cause of emphysema is long-term cigarette smoking, which deteriorates lung tissues over time.',
      },
      {
        title: 'Occupational respiratory disorders',
        content: 'These disorders occur due to prolonged exposure to harmful dust in industries like mining or stone grinding. The body’s defense mechanisms cannot filter the dust effectively, leading to inflammation and fibrosis in the lungs. This causes permanent lung damage. Wearing protective masks is advised to prevent such disorders.',
      },
    ],
  },

  'Body Fluids and Circulation': {
    intro: 'Blood, lymph, the human circulatory system and cardiac cycle.',
    sections: [
      {
        title: 'Need for transport in animals',
        content: 'All living cells require nutrients, oxygen, and the removal of waste products for proper functioning. In simple organisms like sponges, water circulates to allow exchange. Complex animals have evolved fluids like blood and lymph for internal transport. These systems ensure continuous supply and removal of substances to and from cells.',
      },
      {
        title: 'Blood',
        content: 'Blood is a connective tissue with plasma and formed elements. It transports gases, nutrients, hormones, and waste. Plasma makes up 55% of blood and contains water, proteins, minerals, and other solutes. Formed elements include RBCs, WBCs, and platelets, which perform essential functions like oxygen transport, immunity, and clotting.',
      },
      {
        title: 'Plasma',
        content: 'Plasma is the liquid portion of blood, yellowish in colour, and makes up 55% of total volume. It is 90-92% water and 6-8% proteins including fibrinogen, globulins, and albumins. It also contains minerals, nutrients, hormones, and clotting factors. Plasma without clotting proteins is called serum.',
      },
      {
        title: 'Formed elements',
        content: 'Formed elements consist of erythrocytes, leucocytes, and platelets. They constitute 45% of blood. RBCs transport oxygen and contain haemoglobin. WBCs provide immunity and are of various types like neutrophils, lymphocytes, monocytes, eosinophils, and basophils. Platelets help in blood clotting by releasing clotting substances.',
      },
      {
        title: 'Erythrocytes',
        content: 'Erythrocytes or RBCs are the most numerous cells in blood, lacking nuclei in mammals and containing haemoglobin. Their biconcave shape increases surface area for gas exchange. RBCs are produced in red bone marrow and have a life span of 120 days. They are destroyed in the spleen after aging.',
      },
      {
        title: 'Leucocytes',
        content: 'Leucocytes or WBCs are nucleated cells involved in immunity. They are fewer in number compared to RBCs and include granulocytes (neutrophils, eosinophils, basophils) and agranulocytes (lymphocytes and monocytes). Neutrophils and monocytes are phagocytic. Lymphocytes produce immune responses.',
      },
      {
        title: 'Platelets',
        content: 'Platelets or thrombocytes are fragments of megakaryocytes. They number between 1.5 to 3.5 lakhs/mm³ of blood. Platelets are essential for blood clotting. They release substances that promote clot formation. A low platelet count can cause clotting disorders and excessive blood loss.',
      },
      {
        title: 'ABO grouping',
        content: 'ABO grouping depends on antigens A and B on RBCs and antibodies in plasma. Group A has antigen A and anti-B antibody; B has antigen B and anti-A; AB has both antigens and no antibodies; O has no antigens and both antibodies. Group O is a universal donor; AB is a universal recipient.',
      },
      {
        title: 'Rh grouping',
        content: 'Rh grouping is based on the presence of Rh antigen. Rh+ individuals have the antigen, Rh− do not. An Rh− person exposed to Rh+ blood develops antibodies. Rh incompatibility between mother and fetus can lead to erythroblastosis foetalis, a fatal condition preventable by giving anti-Rh antibodies to the mother after first delivery.',
      },
      {
        title: 'Coagulation of blood',
        content: 'Blood clotting prevents excessive bleeding after injury. Platelets release factors that activate prothrombin to form thrombin, which converts fibrinogen into fibrin threads that trap cells and form a clot. Calcium ions and tissue factors are essential for clotting. This cascade ensures blood loss is quickly and effectively controlled.',
      },
      {
        title: 'Lymph formation',
        content: 'When blood flows through capillaries in tissues, water and small soluble substances move into the spaces between cells, forming interstitial or tissue fluid. This fluid lacks large proteins and most blood cells and acts as a medium for the exchange of nutrients and gases between blood and body cells.',
      },
      {
        title: 'Lymphatic system',
        content: 'The lymphatic system collects tissue fluid through a network of vessels and returns it to the major veins. The fluid in these vessels is called lymph. It helps maintain fluid balance in the body and ensures that the leaked fluid from blood vessels is returned to circulation.',
      },
      {
        title: 'Composition of lymph',
        content: 'Lymph is a clear, colourless fluid containing lymphocytes, which play a key role in the body\'s immune responses. Unlike blood, lymph does not contain red blood cells or platelets, but it carries nutrients, hormones, and other essential substances throughout the body.',
      },
      {
        title: 'Functions of lymph',
        content: 'Lymph plays a vital role in transporting nutrients and hormones and in immune defense. It also absorbs fats through structures called lacteals located in the intestinal villi. By draining excess tissue fluid, lymph prevents swelling and maintains fluid homeostasis.',
      },
      {
        title: 'Circulatory pathways',
        content: 'Circulatory systems are of two types: open (in arthropods and molluscs) where blood flows into body cavities, and closed (in annelids and chordates) where blood flows through vessels. Closed systems allow precise regulation. Vertebrates have chambered hearts: fishes (2 chambers), amphibians and most reptiles (3 chambers), and mammals, birds, and crocodiles (4 chambers) for efficient double circulation.',
      },
      {
        title: 'Human circulatory system',
        content: 'The human circulatory system consists of a four-chambered heart, blood vessels, and blood. The heart is protected by the pericardium and has two atria and two ventricles. Valves between chambers and major vessels prevent backflow. The heart is made of cardiac muscle and contains nodal tissue like SAN and AVN which regulate heartbeat. The SAN acts as the pacemaker.',
      },
      {
        title: 'Cardiac cycle',
        content: 'The cardiac cycle consists of a series of systole (contraction) and diastole (relaxation) of the atria and ventricles, lasting about 0.8 seconds. The SAN triggers atrial contraction followed by ventricular contraction via AVN and bundle of His. Each cycle pumps about 70 mL of blood. Cardiac output equals stroke volume × heart rate, averaging 5 litres/min in a healthy person.',
      },
      {
        title: 'Heart sounds',
        content: 'Two distinct heart sounds are produced during each cardiac cycle. The first sound (lub) occurs due to closure of the tricuspid and bicuspid valves at ventricular systole. The second sound (dub) is caused by the closure of semilunar valves during ventricular diastole. These sounds are clinically important for detecting valve function and overall cardiac health.',
      },
      {
        title: 'Electrocardiogram',
        content: 'An electrocardiogram (ECG) is a graphical recording of the heart\'s electrical activity. A standard ECG includes the P-wave (atrial depolarisation), QRS complex (ventricular depolarisation), and T-wave (ventricular repolarisation). By analysing these waves and their timing, one can determine heart rate and detect abnormalities. It is a vital tool in cardiac diagnosis.',
      },
      {
        title: 'Double circulation',
        content: 'Blood flows in a fixed route through arteries and veins, each having three layers: tunica intima (squamous endothelium), tunica media (smooth muscle and elastic fibres), and tunica externa (fibrous connective tissue). The right ventricle pumps deoxygenated blood to the lungs via pulmonary circulation, while the left ventricle sends oxygenated blood to the body via systemic circulation.',
      },
      {
        title: 'Pulmonary and systemic circulation',
        content: 'Pulmonary circulation carries deoxygenated blood from the right ventricle to the lungs and returns oxygenated blood to the left atrium. Systemic circulation transports oxygenated blood from the left ventricle to body tissues and returns deoxygenated blood to the right atrium. Systemic circulation supplies nutrients and oxygen to tissues and removes waste products like CO₂.',
      },
      {
        title: 'Hepatic portal and coronary systems',
        content: 'The hepatic portal system connects the digestive tract to the liver through the hepatic portal vein, allowing nutrient-rich blood to be filtered before entering systemic circulation. The coronary circulation is a dedicated network of blood vessels supplying blood exclusively to the cardiac muscles, ensuring proper nourishment and function of the heart itself.',
      },
      {
        title: 'Regulation of cardiac activity',
        content: 'Heart functions are auto-regulated by nodal tissues, making it myogenic. The medulla oblongata has a neural centre that controls heart activity via the autonomic nervous system (ANS). Sympathetic nerves increase heartbeat and cardiac output, while parasympathetic nerves reduce them. Adrenal medullary hormones also enhance cardiac output.',
      },
      {
        title: 'High blood pressure',
        content: 'High blood pressure or hypertension is defined as blood pressure higher than the normal value of 120/80 mm Hg. If repeated readings are 140/90 mm Hg or more, it indicates hypertension. It can lead to heart disease and damage to vital organs like the brain and kidneys.',
      },
      {
        title: 'Coronary artery disease',
        content: 'Coronary artery disease (CAD), also called atherosclerosis, affects arteries that supply blood to the heart muscle. It is caused by the deposition of cholesterol, fat, calcium, and fibrous tissue in the arterial walls, leading to narrowing of the lumen and reduced blood flow to the heart.',
      },
      {
        title: 'Angina',
        content: 'Angina or angina pectoris is a condition marked by acute chest pain due to insufficient oxygen reaching the heart muscle. It commonly affects middle-aged and elderly individuals. The pain arises due to reduced blood flow caused by narrowed or blocked coronary arteries.',
      },
      {
        title: 'Heart failure',
        content: 'Heart failure refers to the inability of the heart to pump blood effectively to meet the body\'s needs. It is also known as congestive heart failure because lung congestion is a common symptom. It differs from cardiac arrest and heart attack in terms of cause and severity.',
      },
    ],
  },

  'Excretory Products and their Elimination': {
    intro: 'Modes of excretion, the human urinary system and kidney regulation.',
    sections: [
      {
        title: 'Excretory products and their elimination',
        content: 'Animals excrete nitrogenous wastes like ammonia, urea, and uric acid along with CO₂, water, and ions. Ammonotelic animals like fish excrete ammonia, which is toxic and requires a lot of water. Ureotelic animals like mammals excrete urea, while uricotelic animals like birds excrete uric acid, which is least toxic and conserves water.',
      },
      {
        title: 'Excretory structures in animals',
        content: 'Excretory organs vary among animals. Protonephridia in flatworms aid in osmoregulation. Nephridia in annelids remove nitrogenous waste. Malpighian tubules in insects eliminate waste and regulate fluids. Antennal glands or green glands perform excretion in crustaceans like prawns. Vertebrates possess kidneys, which are complex tubular structures for filtration and waste elimination.',
      },
      {
        title: 'Human excretory system',
        content: 'The human excretory system includes two kidneys, ureters, a bladder, and a urethra. Kidneys are bean-shaped and located near the dorsal abdominal wall. The hilum allows entry and exit of blood vessels, nerves, and ureters. Inside, the renal pelvis collects urine from medullary pyramids, which are surrounded by cortex and columns of Bertini.',
      },
      {
        title: 'Structure of nephron',
        content: 'Each kidney has around one million nephrons, the functional units. A nephron consists of the glomerulus and renal tubule. The glomerulus is a tuft of capillaries enclosed by Bowman’s capsule, forming the malpighian body. The renal tubule includes the proximal convoluted tubule, Henle’s loop, distal convoluted tubule, and the collecting duct.',
      },
      {
        title: 'Types of nephrons and blood supply',
        content: 'Cortical nephrons have short loops of Henle, while juxta medullary nephrons have long loops extending deep into the medulla. Efferent arterioles from the glomerulus form peritubular capillaries around tubules. A U-shaped vessel called vasa recta parallels Henle’s loop and is prominent in juxta medullary nephrons, aiding in urine concentration.',
      },
      {
        title: 'Urine formation',
        content: 'Urine formation occurs through three main processes: glomerular filtration, reabsorption, and secretion. Blood is filtered in the glomerulus, and the filtrate passes through the Bowman’s capsule. Nearly all plasma components except proteins enter the filtrate. Reabsorption and secretion along the nephron refine the filtrate into urine, maintaining the body’s chemical balance.',
      },
      {
        title: 'Glomerular filtration',
        content: 'The first step of urine formation is glomerular filtration. Blood pressure forces plasma through three layers into Bowman’s capsule, excluding proteins. This process, called ultrafiltration, forms the initial filtrate. The filtration rate, or GFR, is about 125 ml/min or 180 litres/day in a healthy person.',
      },
      {
        title: 'Structure involved in glomerular filtration',
        content: 'Filtration occurs across three barriers: the endothelium of glomerular capillaries, the basement membrane, and the podocyte layer of Bowman’s capsule. Podocytes have filtration slits that allow only small molecules to pass. This ensures only selected substances like water, salts, and glucose pass through, while proteins and blood cells are retained.',
      },
      {
        title: 'Regulation of glomerular filtration rate',
        content: 'The Juxta Glomerular Apparatus (JGA) helps regulate GFR. It is formed where the distal convoluted tubule meets the afferent arteriole. A drop in GFR activates JG cells to secrete renin, which improves blood flow to the glomerulus and restores GFR, ensuring proper filtration and kidney function.',
      },
      {
        title: 'Reabsorption',
        content: 'Nearly 99% of the filtrate is reabsorbed from the nephron back into the blood. This involves active and passive processes. Nutrients like glucose and amino acids are actively reabsorbed, while water and nitrogenous wastes are passively reabsorbed. This process ensures essential substances are retained, and only waste is excreted.',
      },
      {
        title: 'Tubular secretion',
        content: 'Tubular secretion adds substances like H+, K+, and ammonia into the filtrate. It is crucial for maintaining the body’s acid-base and ionic balance. This process fine-tunes the composition of urine and helps in eliminating excess ions and toxins from the blood.',
      },
      {
        title: 'Role of hypothalamus and',
        content: 'ADH The hypothalamus regulates kidney function through antidiuretic hormone (ADH) released from the neurohypophysis. Osmoreceptors detect fluid loss and trigger ADH release, promoting water reabsorption and reducing urine output. ADH also constricts blood vessels, raising blood pressure and glomerular filtration rate (GFR).',
      },
      {
        title: 'Role of',
        content: 'JGA and renin-angiotensin mechanism A drop in GFR activates the juxtaglomerular apparatus (JGA) to release renin, which converts angiotensinogen to angiotensin I, then to angiotensin II. Angiotensin II raises blood pressure and stimulates aldosterone release, promoting Na⁺ and water reabsorption, ultimately increasing GFR. This system is called the renin-angiotensin mechanism.',
      },
      {
        title: 'Proximal convoluted tubule',
        content: 'The proximal convoluted tubule (PCT) has brush border epithelium that increases surface area for reabsorption. It reabsorbs nearly all essential nutrients and 70–80% of electrolytes and water. PCT also regulates pH and ionic balance by selectively secreting hydrogen ions and ammonia and reabsorbing bicarbonate (HCO3⁻) from the filtrate.',
      },
      {
        title: 'Henle\'s loop',
        content: 'Henle’s loop has two limbs with different permeabilities. The descending limb allows water reabsorption but not electrolytes, concentrating the filtrate. The ascending limb is impermeable to water but permits electrolyte transport, diluting the filtrate. This segment maintains the high osmolarity of the medullary interstitium, aiding in urine concentration.',
      },
      {
        title: 'Distal convoluted tubule',
        content: 'The distal convoluted tubule (DCT) performs conditional reabsorption of sodium and water. It also reabsorbs bicarbonate and selectively secretes hydrogen, potassium ions, and ammonia. These functions help regulate the pH and sodium-potassium balance in the blood, maintaining homeostasis in body fluids.',
      },
      {
        title: 'Collecting duct',
        content: 'The collecting duct runs from the renal cortex to the inner medulla. It reabsorbs large amounts of water to produce concentrated urine and allows urea to enter the medullary interstitium, sustaining osmolarity. It also contributes to pH and ionic balance through selective secretion of hydrogen and potassium ions.',
      },
      {
        title: 'Role of henle\'s loop and vasa recta',
        content: 'Henle’s loop and vasa recta are crucial for producing concentrated urine in mammals. Their filtrate and blood flow in opposite directions form a counter current system. This arrangement helps create an osmolarity gradient in the medullary interstitium, ranging from 300 to 1200 mOsmolL⁻¹, essential for water reabsorption.',
      },
      {
        title: 'Counter current mechanism',
        content: 'The counter current mechanism involves NaCl and urea transport. NaCl from Henle’s loop is exchanged with vasa recta and returned to the interstitium. Urea recirculates between the collecting tubule and Henle’s loop. This mechanism maintains the concentration gradient in the medulla, enabling water reabsorption and producing concentrated urine.',
      },
      {
        title: 'Concentration of urine',
        content: 'The osmotic gradient in the medullary interstitium allows water to move out of the collecting tubule easily. This process helps concentrate the filtrate, allowing human kidneys to produce urine nearly four times more concentrated than the initial glomerular filtrate, conserving water efficiently in the body.',
      },
      {
        title: 'Micturition process',
        content: 'Urine formed in the nephrons is stored in the urinary bladder. As the bladder fills, stretch receptors send signals to the CNS, which initiates contraction of bladder muscles and relaxation of the urethral sphincter, leading to urination. This process is called micturition, and the neural control behind it is the micturition reflex.',
      },
      {
        title: 'Urine composition and characteristics',
        content: 'An adult excretes about 1 to 1.5 litres of urine daily. It is a light yellow, slightly acidic (pH 6.0) fluid with a distinct odour. Around 25-30 grams of urea is excreted per day. Variations in urine composition can indicate health issues.',
      },
      {
        title: 'Clinical importance of urine analysis',
        content: 'Urine analysis is useful in diagnosing metabolic disorders and kidney problems. The presence of glucose (glycosuria) or ketone bodies (ketonuria) in urine signals conditions like diabetes mellitus, helping in early detection and management of such diseases.',
      },
      {
        title: 'Liver in excretion',
        content: 'The liver secretes bile containing bilirubin, biliverdin, cholesterol, degraded hormones, vitamins, and drugs. These substances are passed into the digestive tract and eliminated with faeces. The liver plays a major role in breaking down toxins and waste products.',
      },
      {
        title: 'Skin in excretion',
        content: 'Sweat glands in the skin excrete water, NaCl, urea, and lactic acid. Although sweat mainly cools the body, it also helps in waste removal. Sebaceous glands release sterols, hydrocarbons, and waxes via sebum, which protects the skin and also aids in minor excretion.',
      },
      {
        title: 'Saliva in excretion',
        content: 'Small amounts of nitrogenous waste can also be eliminated through saliva, although it is a minor route of excretion compared to lungs, liver, and skin.',
      },
      {
        title: 'Uremia and hemodialysis',
        content: 'Uremia is a condition where urea accumulates in the blood due to kidney malfunction. It can lead to kidney failure. Hemodialysis is used to remove urea by filtering blood through a dialysing unit with a semipermeable membrane and dialysing fluid. Clean blood is returned to the body, offering relief to patients.',
      },
      {
        title: 'Kidney transplantation',
        content: 'Kidney transplantation is the ultimate treatment for acute renal failure. A healthy kidney from a donor, preferably a close relative, is transplanted into the patient to reduce immune rejection. With advancements in medical procedures, the success rate of kidney transplants has significantly improved, benefiting many patients.',
      },
      {
        title: 'Renal calculi',
        content: 'Renal calculi are stones formed by the crystallisation of salts such as oxalates in the kidneys. These stones are hard and insoluble, causing pain and urinary complications. They may require medical or surgical treatment depending on size and severity.',
      },
      {
        title: 'Glomerulonephritis',
        content: 'Glomerulonephritis is the inflammation of the glomeruli in the kidneys. This condition can impair kidney function and may be caused by infections, autoimmune disorders, or other underlying health issues. It may lead to protein loss in urine and kidney damage if untreated.',
      },
    ],
  },

  'Locomotion and Movement': {
    intro: 'Types of movement, muscles, the skeletal system and joints.',
    sections: [
      {
        title: 'Locomotion and movement',
        content: 'Movement is a key characteristic of living beings. It includes actions like limb, tongue, or eyelid movement. Locomotion is a voluntary movement leading to change of location, such as walking or swimming. All locomotion is movement, but not all movement is locomotion. Locomotion helps in searching for food, shelter, mates, or escaping threats.',
      },
      {
        title: 'Types of movement',
        content: 'Human cells show three types of movements: amoeboid, ciliary, and muscular. Amoeboid movement occurs in macrophages and leucocytes using pseudopodia and cytoskeletal microfilaments. Ciliary movement helps in clearing dust from the trachea and moving ova in the reproductive tract. Muscular movement involves muscles and supports locomotion and various body movements in coordination with skeletal and neural systems.',
      },
      {
        title: 'Skeletal system',
        content: 'The skeletal system is made of 206 bones and a few cartilages. It provides structural support, protection, and helps in movement. Bones are hard due to calcium salts, while cartilage is pliable due to chondroitin salts. It is divided into axial and appendicular skeletons, which include the skull, ribs, limbs, and girdles.',
      },
      {
        title: 'Axial skeleton',
        content: 'The axial skeleton has 80 bones along the body’s main axis, including the skull, vertebral column, sternum, and ribs. The skull has 22 bones: 8 cranial and 14 facial. It also includes the hyoid bone and ear ossicles. The skull connects to the vertebral column using occipital condyles, forming a dicondylic skull.',
      },
      {
        title: 'Vertebral column',
        content: 'The vertebral column has 26 vertebrae: cervical (7), thoracic (12), lumbar (5), sacral (1 fused), and coccygeal (1 fused). It supports the head, protects the spinal cord, and provides attachment points for ribs and muscles. The spinal cord passes through the neural canal. The first vertebra is the atlas, articulating with the skull.',
      },
      {
        title: 'Ribs and sternum',
        content: 'There are 12 pairs of ribs. The first 7 pairs are true ribs, attached directly to the sternum. The next 3 pairs are false ribs, connected indirectly via cartilage. The last 2 pairs are floating ribs with no ventral attachment. The sternum is a flat bone in the chest that anchors the ribs.',
      },
      {
        title: 'Rib cage',
        content: 'The rib cage includes the thoracic vertebrae, ribs, and sternum. It protects vital organs like the heart and lungs and assists in breathing. It is a flexible structure that supports the thoracic cavity, with ribs connected dorsally to the vertebrae and ventrally to the sternum through cartilage.',
      },
      {
        title: 'Appendicular skeleton',
        content: 'The appendicular skeleton includes bones of the limbs and their girdles. Each limb has 30 bones. The upper limb has the humerus, radius, ulna, carpals (8), metacarpals (5), and phalanges (14). The lower limb has femur, tibia, fibula, tarsals (7), metatarsals (5), phalanges (14), and the patella.',
      },
      {
        title: 'Pectoral girdle',
        content: 'Each half of the pectoral girdle has a clavicle and scapula. The scapula is a flat triangular bone with a spine ending in the acromion, which connects with the clavicle. The glenoid cavity below the acromion connects to the humerus, forming the shoulder joint. The clavicle is also called the collar bone.',
      },
      {
        title: 'Pelvic girdle',
        content: 'The pelvic girdle consists of two coxal bones, each formed by fusion of ilium, ischium, and pubis. These bones meet at the acetabulum, which articulates with the femur. Both halves join at the pubic symphysis, which has fibrous cartilage. It connects the lower limbs to the axial skeleton and supports the body.',
      },
      {
        title: 'Muscle and its properties',
        content: 'Muscles are mesodermal tissues that contribute 40–50% of human body weight. They have special properties like excitability, contractility, extensibility, and elasticity. Muscle types are classified based on location, structure, and control: skeletal (voluntary, striated), visceral (involuntary, smooth), and cardiac (involuntary, striated, found in heart).',
      },
      {
        title: 'Skeletal muscle structure',
        content: 'Skeletal muscles are made of bundles called fascicles, covered by fascia. Each bundle contains muscle fibres surrounded by sarcolemma and filled with sarcoplasm. Muscle fibres are multinucleated (syncytium) and contain sarcoplasmic reticulum for calcium storage and many myofibrils which are responsible for the muscle’s striated appearance.',
      },
      {
        title: 'Myofibrils and sarcomere',
        content: 'Myofibrils show alternate dark (A-band) and light (I-band) bands due to actin and myosin protein arrangement. Thin actin filaments attach to the Z line and thick myosin filaments are held by the M line. The sarcomere, between two Z lines, is the functional unit of contraction. The H zone lies in the middle of the A band.',
      },
      {
        title: 'Structure of contractile proteins',
        content: 'Actin filaments are made of two F-actins (formed from G-actins) twisted together, with tropomyosin and troponin attached. Troponin covers active binding sites in resting state. Myosin filaments are polymers of meromyosin, having a globular head (with ATPase and actin-binding site) and a tail. The head forms cross bridges during contraction.',
      },
      {
        title: 'Mechanism of muscle contraction',
        content: 'The sliding filament theory explains contraction as thin filaments sliding over thick ones. A motor neuron releases acetylcholine at the neuromuscular junction, triggering calcium release. Calcium binds troponin, exposing actin’s active sites. Myosin heads form cross bridges using ATP, pulling actin filaments inward, shortening the sarcomere.',
      },
      {
        title: 'Muscle relaxation and fatigue',
        content: 'After contraction, calcium ions are pumped back into the sarcoplasmic reticulum, masking actin sites and relaxing the muscle. Repeated contraction without rest leads to fatigue due to lactic acid buildup from anaerobic glycolysis. Reaction time and fatigue levels differ among muscle types.',
      },
      {
        title: 'Red and white muscle fibres',
        content: 'Red fibres contain high myoglobin and many mitochondria, supporting aerobic respiration and endurance activities. They appear reddish. White fibres have low myoglobin and fewer mitochondria but more sarcoplasmic reticulum. They rely on anaerobic energy and are suited for quick, short bursts of activity, appearing pale.',
      },
      {
        title: 'Joints',
        content: 'Joints are points of contact between bones or between bones and cartilages and are essential for all types of body movements. They act as fulcrums through which muscular force generates motion. Depending on structure and mobility, joints are classified as fibrous, cartilaginous, and synovial.',
      },
      {
        title: 'Fibrous joints',
        content: 'Fibrous joints are immovable joints where bones are held together by dense fibrous connective tissues. These joints do not allow any movement and are seen in flat skull bones that fuse end-to-end through sutures, forming a rigid and protective structure called the cranium.',
      },
      {
        title: 'Synovial joints',
        content: 'Synovial joints allow considerable movement and are characterised by a fluid-filled synovial cavity between articulating bone surfaces. They play a major role in locomotion. Examples include ball and socket joints, hinge joints, pivot joints, gliding joints, and saddle joints.',
      },
      {
        title: 'Cartilaginous joints',
        content: 'In cartilaginous joints, bones are connected by cartilage, allowing limited movement. A typical example is the joint between adjacent vertebrae in the vertebral column. These joints provide support and flexibility while protecting the spinal cord.',
      },
      {
        title: 'Myasthenia gravis',
        content: 'Myasthenia gravis is an autoimmune disorder that affects the neuromuscular junction. It leads to fatigue, weakening, and eventual paralysis of skeletal muscles. This condition disrupts normal communication between nerves and muscles, impairing voluntary movements.',
      },
      {
        title: 'Muscular dystrophy',
        content: 'Muscular dystrophy refers to a group of genetic disorders that cause progressive degeneration and weakening of skeletal muscles. It is usually inherited and worsens over time, leading to severe muscle damage and mobility issues.',
      },
      {
        title: 'Tetany',
        content: 'Tetany is characterised by rapid, involuntary muscle spasms or wild contractions. It is caused by a deficiency of calcium ions (Ca++) in body fluids, which disrupts normal muscle function and control.',
      },
      {
        title: 'Arthritis',
        content: 'Arthritis is a condition involving inflammation of the joints, leading to pain, swelling, and restricted movement. It can be caused by autoimmune responses, infections, or wear and tear of joints over time.',
      },
      {
        title: 'Osteoporosis',
        content: 'Osteoporosis is an age-related disorder marked by reduced bone mass and increased risk of fractures. It commonly occurs due to decreased estrogen levels, especially in post-menopausal women, weakening the bone structure.',
      },
      {
        title: 'Disorders of Muscular and Skeletal System',
        content: 'Gout Gout is a type of arthritis caused by the accumulation of uric acid crystals in the joints. It results in severe joint inflammation, pain, and swelling, often affecting the big toe and other joints.',
      },
    ],
  },

  'Neural Control and Coordination': {
    intro: 'Neurons, nerve impulse, the human nervous system and sense organs.',
    sections: [
      {
        title: 'Neural control and coordination',
        content: 'Coordination is essential for maintaining homeostasis, ensuring different organs function together. For instance, during physical exercise, organs like muscles, lungs, heart, and kidneys adjust their activity levels to meet the body’s increased energy and oxygen demands. The neural and endocrine systems together regulate and integrate these changes to maintain synchrony among organ systems.',
      },
      {
        title: 'Neural system',
        content: 'The neural system consists of specialised cells called neurons that detect, receive, and transmit stimuli. In lower invertebrates like Hydra, it is a simple network of neurons. Insects show a more advanced system with a brain and ganglia. Vertebrates possess a highly developed neural system, enabling better coordination and response to complex stimuli.',
      },
      {
        title: 'Human neural system',
        content: 'The human neural system is divided into the central neural system (CNS) and peripheral neural system (PNS). The CNS consists of the brain and spinal cord and controls information processing. The PNS includes all nerves outside the CNS that connect it to body parts, enabling communication between the CNS and the rest of the body.',
      },
      {
        title: 'Types of nerve fibres',
        content: 'The peripheral neural system includes two types of nerve fibres: afferent and efferent. Afferent fibres carry sensory impulses from tissues or organs to the CNS, while efferent fibres transmit motor commands from the CNS to peripheral tissues or organs, helping regulate their activities.',
      },
      {
        title: 'Divisions of PNS',
        content: 'The peripheral neural system is divided into the somatic and autonomic neural systems. The somatic neural system controls voluntary movements by carrying signals from the CNS to skeletal muscles. The autonomic system controls involuntary actions by transmitting impulses to smooth muscles and internal organs.',
      },
      {
        title: 'Autonomic nervous system',
        content: 'The autonomic nervous system is a part of the peripheral neural system that manages involuntary functions. It is further divided into the sympathetic and parasympathetic systems. These two work in coordination to regulate functions like heartbeat, digestion, and respiration by stimulating or relaxing different organs.',
      },
      {
        title: 'Visceral nervous system',
        content: 'The visceral nervous system is a part of the peripheral nervous system responsible for transmitting impulses between the central nervous system and internal organs (viscera). It includes a network of nerves, ganglia, fibres, and plexuses that manage both sensory and motor functions of the internal body organs.',
      },
      {
        title: 'Neuron as structural and functional unit of neural system',
        content: 'A neuron has three main parts: cell body, dendrites, and axon. The cell body has cytoplasm and Nissl’s granules. Dendrites carry impulses to the cell body, and the axon carries them away. Neurons can be multipolar, bipolar, or unipolar. Axons are either myelinated or unmyelinated, and Schwann cells form the myelin sheath in myelinated fibers.',
      },
      {
        title: 'Generation and conduction of nerve impulse',
        content: 'A neuron at rest is polarized due to ion gradients maintained by the sodium-potassium pump. When stimulated, the membrane becomes permeable to sodium ions, causing depolarization and generating an action potential. The impulse travels along the axon as each adjacent area depolarizes. The membrane quickly repolarizes by allowing potassium ions to exit, restoring the resting potential.',
      },
      {
        title: 'Central neural system',
        content: 'The brain is the body’s main processing centre and regulates voluntary actions, involuntary organ functions, temperature, hunger, thirst, biological rhythms, endocrine activity, and emotions. It is protected by the skull and three-layered cranial meninges: dura mater, arachnoid, and pia mater. The brain consists of three main parts: forebrain, midbrain, and hindbrain.',
      },
      {
        title: 'Forebrain',
        content: 'The forebrain includes the cerebrum, thalamus, and hypothalamus. The cerebrum is the largest part, divided into two hemispheres connected by corpus callosum. The grey matter (cerebral cortex) has motor, sensory, and association areas for higher functions. The thalamus processes sensory and motor signals, while the hypothalamus regulates temperature, hunger, emotions, and secretes hormones.',
      },
      {
        title: 'Midbrain',
        content: 'The midbrain lies between the forebrain and the hindbrain. It has a canal called the cerebral aqueduct and contains corpora quadrigemina, which are four rounded swellings. It acts as a relay centre for visual and auditory impulses and also coordinates certain reflexes.',
      },
      {
        title: 'Hindbrain',
        content: 'The hindbrain comprises the pons, cerebellum, and medulla oblongata. The pons connects different brain regions, the cerebellum manages balance and motor control, and the medulla regulates vital functions like breathing, heart rate, and digestion. The brainstem, consisting of the midbrain, pons, and medulla, connects the brain with the spinal cord.',
      },
    ],
  },

  'Chemical Coordination and Integration': {
    intro: 'Endocrine glands, hormones and the mechanism of hormone action.',
    sections: [
      {
        title: 'Chemical coordination and integration',
        content: 'The neural system provides quick and short-lived coordination among organs through point-to-point connections. However, since nerve fibres cannot reach all body cells and many functions require continuous regulation, hormones provide this coordination. Thus, the endocrine and neural systems work together to regulate physiological functions in the human body.',
      },
      {
        title: 'Endocrine glands and hormones',
        content: 'Endocrine glands are ductless and release hormones directly into the blood. Hormones are non-nutrient chemicals produced in small quantities that act as intercellular messengers. Unlike earlier definitions, modern science includes various molecules under hormones. While invertebrates have simple endocrine systems, vertebrates use many hormones for complex coordination.',
      },
      {
        title: 'Human endocrine system',
        content: 'The endocrine system includes glands and hormone-producing tissues throughout the body. Major endocrine glands are pituitary, pineal, thyroid, adrenal, pancreas, parathyroid, thymus, and gonads. Other organs like the heart, kidney, liver, and gastrointestinal tract also secrete hormones. These hormones regulate metabolism, growth, reproduction, and other physiological functions.',
      },
      {
        title: 'The hypothalamus',
        content: 'The hypothalamus, part of the forebrain, contains neurosecretory cells that produce releasing and inhibiting hormones. These regulate pituitary hormone secretion via the portal circulatory system. Hormones like GnRH stimulate pituitary activity, while somatostatin inhibits growth hormone release. The posterior pituitary is directly controlled by neural signals from the hypothalamus.',
      },
      {
        title: 'The pituitary gland',
        content: 'Located in the sella tursica and attached to the hypothalamus, the pituitary is divided into adenohypophysis (anterior) and neurohypophysis (posterior). The anterior pituitary secretes GH, PRL, TSH, ACTH, LH, and FSH, while the posterior releases oxytocin and vasopressin. Hormones regulate growth, reproduction, lactation, metabolism, and water balance.',
      },
      {
        title: 'The pineal gland',
        content: 'Situated on the dorsal forebrain, the pineal gland secretes melatonin, which maintains the body’s circadian rhythm including the sleep-wake cycle and body temperature. Melatonin also influences metabolism, skin pigmentation, menstrual cycle regulation, and immune defense capabilities.',
      },
      {
        title: 'Thyroid gland',
        content: 'The thyroid, located on either side of the trachea, secretes thyroxine (T4), triiodothyronine (T3), and thyrocalcitonin. T3 and T4 regulate metabolism, growth, RBC production, and water balance. Thyrocalcitonin controls blood calcium levels. Iodine deficiency causes goitre and hypothyroidism, while hyperthyroidism leads to conditions like Graves’ disease.',
      },
      {
        title: 'Parathyroid gland',
        content: 'Located behind the thyroid, the four parathyroid glands secrete parathyroid hormone (PTH), which increases blood calcium levels. PTH promotes bone resorption, calcium reabsorption in kidneys, and calcium absorption from the intestine. It works with thyrocalcitonin to maintain calcium balance in the body.',
      },
      {
        title: 'Thymus',
        content: 'The thymus is present behind the sternum and between the lungs. It secretes thymosins, which help in the differentiation of T-lymphocytes and production of antibodies, supporting both cell-mediated and humoral immunity. The thymus degenerates with age, reducing immune responses in the elderly.',
      },
      {
        title: 'Adrenal gland',
        content: 'Each adrenal gland sits atop a kidney and has an outer cortex and inner medulla. The medulla secretes adrenaline and noradrenaline during stress. The cortex produces glucocorticoids (e.g., cortisol), mineralocorticoids (e.g., aldosterone), and androgens. These hormones regulate',
      },
      {
        title: 'Pancreas',
        content: 'The pancreas has both endocrine and exocrine functions. Its endocrine part, the Islets of Langerhans, contains α-cells that secrete glucagon and β-cells that produce insulin. Glucagon increases blood sugar via glycogenolysis and gluconeogenesis. Insulin reduces blood sugar by promoting glucose uptake and storage. Their balance maintains glucose homeostasis.',
      },
      {
        title: 'Testis',
        content: 'The testis functions as a reproductive and endocrine organ. Interstitial Leydig cells produce androgens, mainly testosterone. Androgens control male reproductive organ development, secondary sexual traits, spermatogenesis, and male sexual behavior. They also support muscle growth and regulate protein and carbohydrate metabolism.',
      },
      {
        title: 'Ovary',
        content: 'Ovaries produce ova and hormones estrogen and progesterone. Estrogen, from developing follicles, regulates female reproductive organs, secondary sexual traits, and mammary gland growth. After ovulation, the corpus luteum produces progesterone, which supports pregnancy and milk-producing alveoli development in mammary glands.',
      },
      {
        title: 'Hormones of heart, kidney and gastrointestinal tract',
        content: 'Certain non-endocrine tissues also secrete important hormones. The heart releases atrial natriuretic factor (ANF) to reduce blood pressure. The kidney secretes erythropoietin, which promotes red blood cell formation. The gastrointestinal tract produces gastrin, secretin, CCK, and GIP, which regulate digestion. Additionally, growth factors from various tissues aid in tissue growth and repair.',
      },
      {
        title: 'Mechanism of hormone action',
        content: 'Hormones act on specific target tissues by binding to hormone receptors, either on the cell membrane or inside the cell. This forms a hormone-receptor complex that triggers biochemical changes. Membrane-bound receptors use second messengers, while intracellular receptors often alter gene expression. Hormones are classified as peptides, steroids, iodothyronines, or amino acid derivatives.',
      },
    ],
  },

};

export default BiologyNotes;