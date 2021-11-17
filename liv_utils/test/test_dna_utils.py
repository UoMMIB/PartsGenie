'''
liv-utils (c) University of Liverpool. 2020

All rights reserved.

@author:  neilswainston
'''
import json
import os
import unittest

from Bio.Restriction import HgaI, MlyI

from liv_utils import dna_utils, sbol_utils
from liv_utils.test import test_sbol_utils


class Test(unittest.TestCase):
    '''Test class for dna_utils.'''

    def test_copy(self):
        '''Tests copy method.'''
        directory = os.path.dirname(os.path.realpath(__file__))
        dna1 = sbol_utils.read(os.path.join(directory, 'sbol.xml'))
        dna2 = test_sbol_utils.round_trip(dna1.copy())
        self.assertEqual(dna1, dna2)

    def test_concat(self):
        '''Tests concat method.'''
        directory = os.path.dirname(os.path.realpath(__file__))
        dna1 = sbol_utils.read(os.path.join(directory, 'sbol.xml'))
        dna2 = sbol_utils.read(os.path.join(directory, 'sbol2.xml'))
        concat_dna = test_sbol_utils.round_trip(dna_utils.concat([dna1, dna2]))

        self.assertFalse(concat_dna['features'][0]['forward'])

        self.assertEqual(len(dna1['features']) + len(dna2['features']),
                         len(concat_dna['features']))

    def test_json(self):
        '''Tests json roundtrip.'''
        directory = os.path.dirname(os.path.realpath(__file__))
        dna1 = sbol_utils.read(os.path.join(directory, 'sbol.xml'))
        params = json.loads(json.dumps(dna1))
        dna2 = dna_utils.DNA(**params)
        self.assertEqual(dna1, dna2)

    def test_app_restrict_site_linear(self):
        '''Tests apply_restriction_site method.'''
        _, dnas = _get_apply_restrict_site_dnas(MlyI, False)
        self.assertEqual([len(dna['seq']) for dna in dnas], [25, 831, 25])

    def test_app_restrict_site_circular(self):
        '''Tests apply_restriction_site method.'''
        _, dnas = _get_apply_restrict_site_dnas('MlyI', True)
        self.assertEqual([len(dna['seq']) for dna in dnas], [50, 831])

    def test_app_restrict_site_nomatch(self):
        '''Tests aplly_restriction_site method.'''
        parent, dnas = _get_apply_restrict_site_dnas(HgaI, False)
        self.assertEqual(len(dnas), 1)
        self.assertEqual(parent, dnas[0])


def _get_apply_restrict_site_dnas(restr, circ):
    '''Tests apply_restriction_site method.'''
    directory = os.path.dirname(os.path.realpath(__file__))
    par = sbol_utils.read(os.path.join(directory, 'restrict.xml'))
    return par, [test_sbol_utils.round_trip(dna)
                 for dna in dna_utils.apply_restricts(par, [restr], circ)]


if __name__ == "__main__":
    # import sys;sys.argv = ['', 'Test.testName']
    unittest.main()
