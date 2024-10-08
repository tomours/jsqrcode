/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import { Version } from "./version.js";
import FormatInformation from './formatinf.js';
import DataMask from './datamask.js';

export default function BitMatrixParser(bitMatrix) {
	var dimension = bitMatrix.Dimension;
	if (dimension < 21 || (dimension & 0x03) != 1) {
		throw "Error BitMatrixParser";
	}
	this.bitMatrix = bitMatrix;
	this.parsedVersion = null;
	this.parsedFormatInfo = null;

	this.copyBit = function (i, j, versionBits) {
		return this.bitMatrix.get_Renamed(i, j) ? (versionBits << 1) | 0x1 : versionBits << 1;
	}

	this.readFormatInformation = function () {
		if (this.parsedFormatInfo != null) {
			return this.parsedFormatInfo;
		}

		// Read top-left format info bits
		var formatInfoBits = 0;
		for (var i = 0; i < 6; i++) {
			formatInfoBits = this.copyBit(i, 8, formatInfoBits);
		}
		// .. and skip a bit in the timing pattern ...
		formatInfoBits = this.copyBit(7, 8, formatInfoBits);
		formatInfoBits = this.copyBit(8, 8, formatInfoBits);
		formatInfoBits = this.copyBit(8, 7, formatInfoBits);
		// .. and skip a bit in the timing pattern ...
		for (var j = 5; j >= 0; j--) {
			formatInfoBits = this.copyBit(8, j, formatInfoBits);
		}

		this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
		if (this.parsedFormatInfo != null) {
			return this.parsedFormatInfo;
		}

		// Hmm, failed. Try the top-right/bottom-left pattern
		var dimension = this.bitMatrix.Dimension;
		formatInfoBits = 0;
		var iMin = dimension - 8;
		for (var i = dimension - 1; i >= iMin; i--) {
			formatInfoBits = this.copyBit(i, 8, formatInfoBits);
		}
		for (var j = dimension - 7; j < dimension; j++) {
			formatInfoBits = this.copyBit(8, j, formatInfoBits);
		}

		this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
		if (this.parsedFormatInfo != null) {
			return this.parsedFormatInfo;
		}
		throw "Error readFormatInformation";
	}
	this.readVersion = function () {

		if (this.parsedVersion != null) {
			return this.parsedVersion;
		}

		var dimension = this.bitMatrix.Dimension;

		var provisionalVersion = (dimension - 17) >> 2;
		if (provisionalVersion <= 6) {
			return Version.getVersionForNumber(provisionalVersion);
		}

		// Read top-right version info: 3 wide by 6 tall
		var versionBits = 0;
		var ijMin = dimension - 11;
		for (var j = 5; j >= 0; j--) {
			for (var i = dimension - 9; i >= ijMin; i--) {
				versionBits = this.copyBit(i, j, versionBits);
			}
		}

		this.parsedVersion = Version.decodeVersionInformation(versionBits);
		if (this.parsedVersion != null && this.parsedVersion.DimensionForVersion == dimension) {
			return this.parsedVersion;
		}

		// Hmm, failed. Try bottom left: 6 wide by 3 tall
		versionBits = 0;
		for (var i = 5; i >= 0; i--) {
			for (var j = dimension - 9; j >= ijMin; j--) {
				versionBits = this.copyBit(i, j, versionBits);
			}
		}

		this.parsedVersion = Version.decodeVersionInformation(versionBits);
		if (this.parsedVersion != null && this.parsedVersion.DimensionForVersion == dimension) {
			return this.parsedVersion;
		}
		throw "Error readVersion";
	}
	this.readCodewords = function () {

		var formatInfo = this.readFormatInformation();
		var version = this.readVersion();

		// Get the data mask for the format used in this QR Code. This will exclude
		// some bits from reading as we wind through the bit matrix.
		var dataMask = DataMask.forReference(formatInfo.DataMask);
		var dimension = this.bitMatrix.Dimension;
		dataMask.unmaskBitMatrix(this.bitMatrix, dimension);

		var functionPattern = version.buildFunctionPattern();

		var readingUp = true;
		var result = new Array(version.TotalCodewords);
		var resultOffset = 0;
		var currentByte = 0;
		var bitsRead = 0;
		// Read columns in pairs, from right to left
		for (var j = dimension - 1; j > 0; j -= 2) {
			if (j == 6) {
				// Skip whole column with vertical alignment pattern;
				// saves time and makes the other code proceed more cleanly
				j--;
			}
			// Read alternatingly from bottom to top then top to bottom
			for (var count = 0; count < dimension; count++) {
				var i = readingUp ? dimension - 1 - count : count;
				for (var col = 0; col < 2; col++) {
					// Ignore bits covered by the function pattern
					if (!functionPattern.get_Renamed(j - col, i)) {
						// Read a bit
						bitsRead++;
						currentByte <<= 1;
						if (this.bitMatrix.get_Renamed(j - col, i)) {
							currentByte |= 1;
						}
						// If we've made a whole byte, save it off
						if (bitsRead == 8) {
							result[resultOffset++] = currentByte;
							bitsRead = 0;
							currentByte = 0;
						}
					}
				}
			}
			readingUp ^= true; // readingUp = !readingUp; // switch directions
		}
		if (resultOffset != version.TotalCodewords) {
			throw "Error readCodewords";
		}
		return result;
	}
}