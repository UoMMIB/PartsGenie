import unittest

#https://www.internalpointers.com/post/run-painless-test-suites-python-unittest

# import test modules
import liv_utils.test.test_codon_utils as codon_utils
import liv_utils.test.test_dna_utils as dna_utils
import liv_utils.test.test_genbank_utils as genbank_utils
import liv_utils.test.test_ice_utils as ice_utils
## need job_utils
## need ncbi_tax_utils
## need net_utils
import liv_utils.test.test_sbol_utils as sbol_utils
import liv_utils.test.test_seq_utils as seq_utils
## need thread_utils
import liv_utils.test.test_uniprot_utils as uniprot_utils

#import parts_genie.test.test_parts as parts_utils
#import parts_genie.test.test_rbs_calculator_vienna as rbs_calculator_vienna_utils

#import test.test_organisms as organisms

# internalize the test suite
loader = unittest.TestLoader()
suite = unittest.TestSuite()

# add tests to the test suite
suite.addTests(loader.loadTestsFromModule(codon_utils))
suite.addTests(loader.loadTestsFromModule(dna_utils))
suite.addTests(loader.loadTestsFromModule(genbank_utils))
suite.addTests(loader.loadTestsFromModule(ice_utils))
suite.addTests(loader.loadTestsFromModule(sbol_utils))
suite.addTests(loader.loadTestsFromModule(seq_utils))
suite.addTests(loader.loadTestsFromModule(uniprot_utils))

#suite.addTests(loader.loadTestsFromModule(parts_utils))
#suite.addTests(loader.loadTestsFromModule(rbs_calculator_vienna_utils))
#suite.addTests(loader.loadTestsFromModule(organisms))

# initalize a runner 
runner = unittest.TextTestRunner(verbosity=3)
result = runner.run(suite)