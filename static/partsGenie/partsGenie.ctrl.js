partsGenieApp.controller("partsGenieCtrl", ["$scope", "$timeout", "$uibModal", "ErrorService", "OrganismService", "PartsGenieService", "PathwayGenieService", "ProgressService", "ResultService", "UniprotService", function($scope, $timeout, $uibModal, ErrorService, OrganismService, PartsGenieService, PathwayGenieService, ProgressService, ResultService, UniprotService) {
	var self = this;
	var jobIds = [];
	var jobId = null;
	var search = false;
	var nucl_regex = new RegExp("^[ACGTacgt ]+$");
	var valid = false;
	
	self.codons_regex = new RegExp("^[ACGTacgt\s]{3}$");
	self.query = PartsGenieService.query;
	self.response = {"update": {"values": [], "status": "waiting", "message": "Waiting..."}};

	self.restrEnzs = PathwayGenieService.restrEnzs;
	
	self.pagination = {
			current: 1
		};
	
	self.selectRestEnzs = function(selected) {
		self.restrEnzs = remove(self.restrEnzs, selected);
		self.query.filters.restr_enzs.push.apply(self.query.filters.restr_enzs, selected);
	}
	
	self.deselectRestEnzs = function(selected) {
		self.restrEnzs.push.apply(self.restrEnzs, selected);
		self.query.filters.restr_enzs = remove(self.query.filters.restr_enzs, selected);
	}
	
	self.showHelp = function() {
		return PathwayGenieService.showHelp();
	}
	
	self.hasFeatures = function() {
		for(var i = 0; i < self.query.designs.length; i++) {
			design = self.query.designs[i];
			
			for(var j = 0; j < design.features.length; j++) {
				return true;
			}
		}
		
		return false;
	}

	self.templates = [
		{
			typ: "http://identifiers.org/so/SO:0000001",
			name: "Defined sequence",
			seq: "",
			temp_params: {
				fixed: true,
				required: ["name", "seq"],
				valid: false,
				id: "_1"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000449",
			end: 100,
			name: "Randomised sequence",
			temp_params: {
				fixed: false,
				required: ["name", "len"],
				min_end: 1,
				max_end: 10000,
				valid: true,
				id: "_2"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000143",
			name: "Sequence of defined melting temperature",
			seq: "",
			parameters: {
				"Tm target": 70
			},
			temp_params: {
				fixed: true,
				required: ["name", "tm"],
				valid: true,
				id: "_3"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000296",
			name: "Origin of replication",
			seq: "",
			temp_params: {
				fixed: true,
				required: ["name", "seq"],
				valid: false,
				id: "_4"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000167",
			name: "Promoter",
			seq: "",
			temp_params: {
				fixed: true,
				required: ["name", "seq"],
				valid: false,
				id: "_5"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000139",
			name:"RBS",
			end: 60,
			parameters: {
				"TIR target": 20000
			},
			temp_params: {
				fixed: false,
				required: ["name", "tir"],
				min_end: 35,
				max_end: 10000,
				valid: true,
				id: "_6"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000316",
			name: "CDS",
			temp_params: {
				fixed: false,
				required: ["name", "prot"],
				valid: false,
				stop_codon: true,
				id: "_7"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000316",
			name: "Fixed coding sequence",
			temp_params: {
				fixed: true,
				required: ["name", "seq"],
				valid: false,
				id: "_8"
			}
		},
		{
			typ: "http://identifiers.org/so/SO:0000141",
			name: "Terminator",
			seq: "",
			temp_params: {
				fixed: true,
				required: ["name", "seq"],
				valid: false,
				id: "_9"
			}
		},
	];
	
	self.addFeature = function(feature) {
		var copiedFeature = angular.copy(feature)
		self.copyFeature(copiedFeature);
		self.query.designs[self.pagination.current - 1].features.push(copiedFeature);
	}
	
	self.copyFeature = function(feature) {
		feature.temp_params.id = "_" + Math.floor(Math.random() * 65536) + "_" + (new Date()).getTime();
	}

	self.selected = function() {
		return PartsGenieService.selected;
	};
	
	self.toggleSelected = function(selected) {
		return PartsGenieService.toggleSelected(selected);
	};
	
	self.setValid = function(valid) {
		if(PartsGenieService.selected) {
			PartsGenieService.selected.temp_params.valid = valid;
		}
	};
	
	self.addDesign = function() {
		PartsGenieService.addDesign();
		self.pagination.current = self.query.designs.length;
	};
	
	self.copyDesign = function() {
		var origDesign = self.query.designs[self.pagination.current - 1];
		var copiedDesign = angular.copy(origDesign);
		
		for(var i = 0; i < copiedDesign.features.length; i++) {
			copiedDesign.features[i].temp_params.id = "_" + i + "_" + (new Date()).getTime();
		}
		
		self.query.designs.push(copiedDesign);
		self.pagination.current = self.query.designs.length;
		
		return copiedDesign;
	};
	
	self.bulkCds = function(event, feature_idx) {
		search = true;
		
		$uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: '/static/cds/cdsTerms.html',
			controller: 'cdsTermsCtrl',
			controllerAs: 'ctrl',
		}).result.then(function(cdsTerms) {
			for(var i = 0; i < cdsTerms.length; i++) {
            	autoCds(cdsTerms[i], i, self.pagination.current - 1, feature_idx);
            }
			search = false;
        });
		
		event.stopPropagation();
	}
	
	self.removeDesign = function() {
		self.query.designs.splice(self.pagination.current - 1, 1);
		self.pagination.current = self.pagination.current == 1 ? 1 : self.pagination.current - 1;
		self.toggleSelected(null);
	};
	
	self.organismRequired = function() {
		for(var i = 0; i < self.query.designs.length; i++) {
			design = self.query.designs[i];
		
			for(var j = 0; j < design.features.length; j++) {
				if(design.features[j].typ == "http://identifiers.org/so/SO:0000139"
					|| (design.features[j].typ == "http://identifiers.org/so/SO:0000316"
						&& !design.features[j].temp_params.fixed)) {
					return true;
				}
			}
		}
		
		return false;
	}
	
	self.searchUniprot = function(query) {
		search = true;
		
		PartsGenieService.searchUniprot(query).then(
			function(resp) {
				UniprotService.open(resp.data, PartsGenieService.selected)
				search = false;
			},
			function(errResp) {
				search = false;
			});
	};
	
	self.searching = function() {
		return search;
	};
	
	self.isAmbiguousSeq = function(query) {
		return query && nucl_regex.test(query);
	};

	self.submit = function() {
		jobIds = [];
		jobId = null;
		self.response = {"update": {"values": [], "status": "submitting", "message": "Submitting..."}};
		error = null;
		self.toggleSelected(self.selected());
		ResultService.setResults(null);
		
		ProgressService.open(self.query["app"] + " dashboard", self.cancel, self.update);
		
		PathwayGenieService.submit(self.query).then(
			function(resp) {
				jobIds = resp.data.job_ids;
				listen();
			},
			function(errResp) {
				onerror(errResp.data.message);
			});
	};
	
	self.cancel = function() {
		return PathwayGenieService.cancel(jobId);
	};
	
	self.update = function() {
		return self.response.update;
	};
	
	self.valid = function() {
		return valid;
	}
	
	self.queryJson = angular.toJson({selected: self.selected(), query: self.query}, true);
	
	listen = function() {
		if(jobIds.length == 0) {
			return;
		}
		
		jobId = jobIds[0];
		var source = new EventSource("/progress/" + jobId);

		source.onmessage = function(event) {
			self.response = JSON.parse(event.data);
			status = self.response.update.status;
			
			if(status == "cancelled" || status == "error" || status == "finished") {
				source.close();

				if(status == "finished") {
					ResultService.appendResults(self.response.result);
				}
				
				jobIds.splice(0, 1);
				listen();
			}
			
			$scope.$apply();
		};
		
		source.onerror = function(event) {
			source.close();
			jobIds.splice(0, 1);
			listen();
			onerror(event.message);
		}
	};
	
	onerror = function(message) {
		self.response.update.status = "error";
		self.response.update.message = "Error";
		ProgressService.close();
		ErrorService.open(message);
	};
	
	remove = function(array, toRemove) {
		array = array.filter(function(elem) {
			return !toRemove.includes(elem);
		});
		
		return array;
	};
	
	autoCds = function(cdsTerm, idx, initial_idx, feature_idx) {
		search = true;
		
		const uniprotRegex = /^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/g;
		const aaSeqRegex = /^[ACDEFGHIKLMNPQRSTVWY]+$/g;
		
		if(uniprotRegex.test(cdsTerm)) {
			PartsGenieService.searchUniprot(cdsTerm).then(
				function(resp) {
					for(entry_idx in resp.data) {
						if(resp.data[entry_idx]["Entry"] == cdsTerm) {
							updateFeature(resp.data[0], idx, initial_idx, feature_idx);
							return;
						}
					}
					
					ErrorService.open("Uniprot search unable to find " + cdsTerm + ".");
				},
				function(errResp) {
					ErrorService.open(errResp.data.message);
					search = false;
				});
		}
		else {
			match = aaSeqRegex.test(cdsTerm.toUpperCase())
			
			if(match) {
				data = {
					"Entry name": "CDS" + idx,
					"Sequence": cdsTerm.toUpperCase()
					};
				
				updateFeature(data, idx, initial_idx, feature_idx);
			}
			else {
				ErrorService.open(cdsTerm + " not recognised as Uniprot id or amino acid sequence.");
			}
			
			search = false;
		}
	}
	
	updateFeature = function(data, idx, initial_idx, feature_idx) {
		var curr_design = null;
		
		if(idx > 0) {
			curr_design = self.copyDesign();
		}
		else {
			curr_design = self.query.designs[initial_idx]
		}
		
		UniprotService.updateFeature(curr_design.features[feature_idx], data);
		search = false;
	}
	
	setValidity = function() {
		valid = true;
		
		for(var i = 0; i < self.query.designs.length; i++) {
			design = self.query.designs[i];
			
			for(var j = 0; j < design.features.length; j++) {
				feature = design.features[j];
				
				// If RBS not followed by CDS:
				if(feature.typ == "http://identifiers.org/so/SO:0000139") {
					var is_cds_next = j != design.features.length - 1
						&& design.features[j + 1].typ == "http://identifiers.org/so/SO:0000316";
					
					feature.temp_params.valid = is_cds_next && OrganismService.getParentId() != "2759";
				}
				
				if(!feature.temp_params.valid) {
					valid = false;
				}
			}
		}
	}
	
	$scope.$watch(function() {
		return self.selected();
	},               
	function(values) {
		self.queryJson = angular.toJson({selected: self.selected(), query: self.query}, true);
	}, true);
	
	$scope.$watch(function() {
		return self.query;
	},               
	function(values) {
		self.queryJson = angular.toJson({selected: self.selected(), query: self.query}, true);
	}, true);
	
	$scope.$watch(function() {
		return self.pagination;
	},               
	function(values) {
		PartsGenieService.selected = null;
	}, true);
	
	$scope.$watch(function() {
		return self.query.designs;
	},               
	function(values) {
		setValidity();
	}, true);
	
	$scope.$watch(function() {
		return OrganismService.getParentId();
	},               
	function(values) {
		setValidity();
	}, true);
	
}]);