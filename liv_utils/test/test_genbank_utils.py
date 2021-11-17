'''
liv-utils (c) University of Liverpool. 2020

All rights reserved.

@author:  neilswainston
'''
import tempfile
import unittest

from Bio import SeqIO

from liv_utils.genbank_utils import GenbankBuilder


class Test(unittest.TestCase):
    '''Test class for dna_utils.'''

    def test(self):
        '''Tests GenbankBuilder write / read.'''
        builder = GenbankBuilder('AAAAAAAAAAACCCCCCCCCCGGGGGGGGGTTTTTTTTT',
                                 'locus',
                                 'accession')
        builder.add_feature(5, 12, True, 'First', 'CDS')
        builder.add_feature(9, 15, False, 'Second', 'RBS')

        tmpfile = tempfile.NamedTemporaryFile()
        builder.write_record(tmpfile.name)

        record = SeqIO.read(tmpfile.name, 'genbank')
        self.assertEqual(len(record.features), 2)


if __name__ == "__main__":
    # import sys;sys.argv = ['', 'Test.testName']
    unittest.main()
