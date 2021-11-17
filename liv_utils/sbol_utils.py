'''
liv-utils (c) University of Liverpool. 2020

All rights reserved.

@author:  neilswainston
'''
import re
import uuid

from sbol2 import ComponentDefinition, Document, Range, Sequence, \
    SequenceAnnotation, \
    SBOL_ENCODING_IUPAC, \
    SBOL_ORIENTATION_INLINE, \
    SBOL_ORIENTATION_REVERSE_COMPLEMENT

from liv_utils.dna_utils import DNA, SO_PART, get_disp_id


_DNA_REGION = 'http://www.biopax.org/release/biopax-level3.owl#DnaRegion'


def read(filename):
    '''Parses SBOL v1.'''
    doc = Document()
    doc.read(filename)

    comp_def = doc.componentDefinitions[0]

    params = _read_dna_comp(comp_def)
    params.update({'seq': doc.sequences[0].elements})
    dna = DNA(**params)

    for annot in comp_def.sequenceAnnotations:
        _read_annot(dna, annot)

    return dna


def write(dna, filename=None):
    '''Writes a Dna object to SBOL v2.'''
    doc = Document()

    comp_def = ComponentDefinition(dna['disp_id'])
    doc.addComponentDefinition(comp_def)
    _write_dna_comp(comp_def, dna)

    seq = Sequence(get_disp_id(), dna['seq'], SBOL_ENCODING_IUPAC)
    doc.addSequence(seq)

    for feature in dna['features']:
        annot = SequenceAnnotation(feature['disp_id'])
        comp_def.sequenceAnnotations.add(annot)
        _write_dna_comp(annot, feature)

        rnge = Range(get_disp_id())
        annot.locations.add(rnge)
        rnge.start = feature['start']
        rnge.end = feature['end']
        rnge.orientation = SBOL_ORIENTATION_INLINE if feature['forward'] \
            else SBOL_ORIENTATION_REVERSE_COMPLEMENT

    doc.write(filename)

    return doc


def _read_dna_comp(node):
    '''Read component.'''
    disp_id = node.displayId
    name = node.name
    desc = node.description
    typ = node.roles[0] if node.roles else None

    if not re.match('^[\\w-]+$', disp_id):
        disp_id = str(uuid.uuid4())

    return {'disp_id': disp_id, 'name': name, 'desc': desc, 'typ': typ}


def _read_annot(dna, annot):
    '''Reads annotation node.'''
    params = _read_dna_comp(annot)

    location = annot.locations
    rnge = location.getRange()

    start = rnge.start

    if start:
        params.update({'start': int(start)})

    end = rnge.end

    if end:
        params.update({'end': int(end)})

    forward = rnge.orientation == SBOL_ORIENTATION_INLINE

    if forward:
        params.update({'forward': forward == '+'})

    # Tests due to ICE eccentricities...
    try:
        feat = DNA(**params)

        pos = (feat['start'], feat['end'], feat['forward'])

        # Prevents cases where features are duplicated in the SBOL:
        if pos not in [(feature['start'], feature['end'], feature['forward'])
                       for feature in dna['features']]:
            dna['features'].append(feat)

    except ValueError:
        # Prevents cases with no end position and no sequence:
        print('Ignoring invalid feature.')


def _write_dna_comp(node, dna):
    '''Write DNAComponent node.'''
    node.displayId = dna['disp_id']
    node.name = dna['name']
    node.description = dna['desc']

    try:
        node.types = [_DNA_REGION]
    except AttributeError:
        pass

    node.roles = [dna['typ'] if dna['typ'] else SO_PART]
