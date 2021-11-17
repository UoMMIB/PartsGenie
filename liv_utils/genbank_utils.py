'''
liv-utils (c) University of Liverpool. 2020

All rights reserved.

@author:  neilswainston
'''
# pylint: disable=too-many-arguments
from Bio import Seq, SeqIO, SeqFeature

from liv_utils.dna_utils import SO_RBS, SO_CDS, SO_PROM


_TYP_MAP = {
    SO_RBS: 'RBS',
    SO_CDS: 'CDS',
    SO_PROM: 'promoter'
}


def write(dna, filename):
    '''Writes a Dna object to Genbank.'''
    builder = GenbankBuilder(dna['seq'], dna['disp_id'], dna['name'],
                             dna['desc'])

    for feature in dna['features']:
        builder.add_feature(
            feature['start'], feature['end'], feature['forward'],
            feature['disp_id'], _TYP_MAP.get(feature['typ'], 'misc_feature'))

    builder.write_record(filename)


class GenbankBuilder():
    '''Class to build a Genbank record.'''

    def __init__(self, sequence, locus, accession, desc='', circular=True):
        seq = Seq.Seq(sequence)
        self.__record = SeqIO.SeqRecord(id=accession, seq=seq, name=locus,
                                        description=desc,
                                        annotations={'molecule_type': 'DNA'})

        self.__record.annotations['topology'] = 'circular' if circular \
            else 'linear'

    def add_feature(self, start, end, forward, feat_id, typ='misc_feature'):
        '''Add feature.'''
        location = SeqFeature.FeatureLocation(start, end, 1 if forward else -1)
        feature = SeqFeature.SeqFeature(location, type=typ)
        feature.qualifiers['label'] = feat_id
        self.__record.features.append(feature)

    def get_record(self):
        '''Get record.'''
        return self.__record

    def write_record(self, filename):
        '''Write record.'''
        with open(filename, 'w') as fle:
            SeqIO.write(self.__record, fle, 'genbank')
