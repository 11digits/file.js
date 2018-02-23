"use strict";

window.fileAPI = {
	fs: null,
	initFS: function(callback, options) {
		var options = options || {};

		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		var storageInfo = window.storageInfo || window.webkitStorageInfo;


		if (storageInfo) {
			storageInfo.requestQuota(PERSISTENT, options.storageSize || config.storageSizeReq, function(grantedBytes) {
				console.log('granted', grantedBytes);
				window.requestFileSystem(LocalFileSystem.PERSISTENT || cordova.file.documentsDirectory, options.storageSize || config.storageSizeReq, function (fs) {
					console.log('file system open: ' + fs.name);

					fileAPI.fs = fs;
					if (callback) callback(fs);
				}, function(error) {
					console.log('error', error);
				});
			});
		} else {
			console.log(LocalFileSystem.PERSISTENT, cordova.file.documentsDirectory);

			var loc = LocalFileSystem.PERSISTENT;

			if (device.platform == 'iOS') {
				//loc = cordova.file.documentsDirectory;
			}

			window.requestFileSystem(loc, options.storageSize || config.storageSizeReq, function (fs) {
				console.log('file system open: ' + fs.name);

				fileAPI.fs = fs;
				if (callback) callback(fs);
			}, function(error) {
				console.log('error', error);

				if (error && error.code == 10) {
					alert('Your device does not have the minimum space to alocate towards app storage, trying to alocate a smaller amount (3GB) of space.');

					window.requestFileSystem(loc, 3024 * 1024 * 1024, function (fs) {
						console.log('file system open: ' + fs.name);

						fileAPI.fs = fs;
						if (callback) callback(fs);
					}, function(error) {
						console.log('error', error);

						if (error && error.code == 10) {
							alert('Your device does not have a minimum 1Gb space to run the app.');
						}
					});
				}
			});
		}


	},

	checkIfFileExistsSync: function(fileName){
	    var http = new XMLHttpRequest();
	    http.open('HEAD', fileName, false);
	    http.send(null);
	    return (http.status != 404);
	},

	checkIfFileExists: function(path, callback) {
	    //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
	        fileAPI.fs.root.getFile(path, { create: false }, function(fileEntry) {
				fileEntry.file(function(file) {
			        //console.log(r, file.size);
					fileEntry['file'] = file;

					if (callback) callback(fileEntry);
			    }, function() {
					if (callback) callback(fileEntry);
				});

			}, function() {
			    if (callback) callback(false);
			});
	    //}, function(evt) {
		 //   console.log(evt.target.error.code);
		//});
	},

	dataURItoBlob: function(base64Data, contentType) {
		var b64 = base64Data.split(',')[1];
	    contentType = contentType || (base64Data.split(',')[0].split(':')[1].split(';')[0]);

	    var sliceSize = 1024;
	    var byteCharacters = atob(b64);
	    var bytesLength = byteCharacters.length;
	    var slicesCount = Math.ceil(bytesLength / sliceSize);
	    var byteArrays = new Array(slicesCount);

	    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
	        var begin = sliceIndex * sliceSize;
	        var end = Math.min(begin + sliceSize, bytesLength);

	        var bytes = new Array(end - begin);
	        for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
	            bytes[i] = byteCharacters[offset].charCodeAt(0);
	        }
	        byteArrays[sliceIndex] = new Uint8Array(bytes);
	    }
	    return new Blob(byteArrays, { type: contentType });
	},

	fixURL: function(url, callback) {
		url = url.replace('file://', '');
		return url;
    },

	getFileURL: function(fileEntry, callback) {
		var url = fileEntry.toURL();
		url = url.replace('file://', '');
		if (callback) callback(url);
    },

    getFileEntry: function(fileUri, callback) {
		//console.log('get file entry', fileUri);

		if (!fileUri) {
			callback(false);
			return;
		}

		window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

        window.resolveLocalFileSystemURL(fileUri, function success(fileEntry) {
			console.log('File URI got', fileEntry);
			callback(fileEntry);
        }, function() {
			callback(false);
		});
    },

	saveFile: function(dirEntry, fileData, fileName, options) {
		var self = this;

		dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
			self.writeFile(fileEntry, fileData, false, options);
		}, function(fe) {
			console.log('Error', fe);
		});
	},

    writeFile: function(fileEntry, dataObj, isAppend, options) {
	    fileEntry.createWriter(function (fileWriter) {

	        fileWriter.onwriteend = function() {
	            console.log("Successful file write...");

				if (options.callback) options.callback(fileEntry);
	            /*if (dataObj.type == "image/png") {
	                readBinaryFile(fileEntry);
	            }
	            else {
	                readFile(fileEntry);
	            }*/
	        };

	        fileWriter.onerror = function(e) {
	            console.log("Failed file write: " + e.toString());
	        };

	        fileWriter.write(dataObj);
	    });
	},

    readBinaryFile: function(fileEntry, callback) {
	    fileEntry.file(function (file) {
	        var reader = new FileReader();

	        reader.onloadend = function() {
	            console.log("Successful file read: " + this.result);
	            //displayFileData(fileEntry.fullPath + ": " + this.result);

	            //var blob = new Blob([new Uint8Array(this.result)], { type: "image/png" });
	            //displayImage(blob);
	        };

	        reader.readAsArrayBuffer(file);

	    }, function() {
			console.log('error');
		});
	},

    createDirectory: function(rootDirEntry, newDir, callback) {
	    rootDirEntry.getDirectory(newDir, { create: true }, function (dirEntry) {
			callback(dirEntry);
	    }, function(error) {
			console.log('error', error);
		});
	}
}
