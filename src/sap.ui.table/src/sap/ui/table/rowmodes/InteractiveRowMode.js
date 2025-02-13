/*
 * ${copyright}
 */
sap.ui.define([
	"../library",
	"./RowMode",
	"../utils/TableUtils",
	"sap/base/Log",
	"sap/ui/thirdparty/jquery"
], function(
	library,
	RowMode,
	TableUtils,
	Log,
	jQuery
) {
	"use strict";

	/**
	 * Constructor for a new interactive row mode.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * TODO: Class description
	 * @extends sap.ui.table.rowmodes.RowMode
	 * @constructor
	 * @alias sap.ui.table.rowmodes.InteractiveRowMode
	 * @private
	 * @ui5-restricted sap.ui.mdc
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var InteractiveRowMode = RowMode.extend("sap.ui.table.rowmodes.InteractiveRowMode", /** @lends sap.ui.table.rowmodes.InteractiveRowMode.prototype */ {
		metadata: {
			library: "sap.ui.table",
			"final": true,
			properties: {
				rowContentHeight: {type: "int", defaultValue: 0, group: "Appearance"},
				minRowCount: {type: "int", defaultValue: 5, group: "Appearance"}
			}
		},
		constructor: function(sId) {
			Object.defineProperty(this, "bLegacy", {
				value: typeof sId === "boolean" ? sId : false
			});

			if (this.bLegacy) {
				var oTable = arguments[1];

				this.getParent = function() {
					return oTable;
				};
				RowMode.call(this);
				this.attachEvents();
			} else {
				RowMode.apply(this, arguments);
			}
		}
	});

	var TableDelegate = {};

	/*
	 * Provides drag&drop resize capabilities.
	 */
	var ResizeHelper = {};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.attachEvents = function() {
		RowMode.prototype.attachEvents.apply(this, arguments);
		TableUtils.addDelegate(this.getTable(), TableDelegate, this);
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.detachEvents = function() {
		RowMode.prototype.detachEvents.apply(this, arguments);
		TableUtils.removeDelegate(this.getTable(), TableDelegate);
	};

	/*
	 * @see JSDoc generated by SAPUI5 control API generator
	 */
	InteractiveRowMode.prototype.getRowCount = function() {
		return this.bLegacy ? this.getTable().getVisibleRowCount() : this.getProperty("rowCount");
	};

	/*
	 * @see JSDoc generated by SAPUI5 control API generator
	 */
	InteractiveRowMode.prototype.getFixedTopRowCount = function() {
		return this.bLegacy ? this.getTable().getFixedRowCount() : this.getProperty("fixedTopRowCount");
	};

	/*
	 * @see JSDoc generated by SAPUI5 control API generator
	 */
	InteractiveRowMode.prototype.getFixedBottomRowCount = function() {
		return this.bLegacy ? this.getTable().getFixedBottomRowCount() : this.getProperty("fixedBottomRowCount");
	};

	/*
	 * @see JSDoc generated by SAPUI5 control API generator
	 */
	InteractiveRowMode.prototype.getMinRowCount = function() {
		return this.bLegacy ? this.getTable().getMinAutoRowCount() : this.getProperty("minRowCount");
	};

	/*
	 * @see JSDoc generated by SAPUI5 control API generator
	 */
	InteractiveRowMode.prototype.getRowContentHeight = function() {
		return this.bLegacy ? this.getTable().getRowHeight() : this.getProperty("rowContentHeight");
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.getMinRequestLength = function() {
		return this.getConfiguredRowCount();
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.getComputedRowCounts = function() {
		return this.sanitizeRowCounts(this.getConfiguredRowCount(), this.getFixedTopRowCount(), this.getFixedBottomRowCount());
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.getTableStyles = function() {
		return {
			height: "auto"
		};
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.getTableBottomPlaceholderStyles = function() {
		return undefined;
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.getRowContainerStyles = function() {
		var sHeight = this.getComputedRowCounts().count * this.getBaseRowHeightOfTable() + "px";

		if (this.bLegacy && !TableUtils.isVariableRowHeightEnabled(this.getTable())) {
			return {minHeight: sHeight};
		} else {
			return {height: sHeight};
		}
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.renderRowStyles = function(oRM) {
		var iRowContentHeight = this.getRowContentHeight();

		if (iRowContentHeight > 0) {
			oRM.style("height", this.getBaseRowHeightOfTable() + "px");
		}
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.renderCellContentStyles = function(oRM) {
		var iRowContentHeight = this.getRowContentHeight();

		if (this.bLegacy) {
			return;
		}

		if (iRowContentHeight <= 0) {
			iRowContentHeight = this.getDefaultRowContentHeightOfTable();
		}

		if (iRowContentHeight > 0) {
			oRM.style("max-height", iRowContentHeight + "px");
		}
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.getBaseRowContentHeight = function() {
		return Math.max(0, this.getRowContentHeight());
	};

	/**
	 * @inheritDoc
	 */
	InteractiveRowMode.prototype.refreshRows = function() {
		var iRowCount = this.getConfiguredRowCount();

		if (iRowCount > 0) {
			this.initTableRowsAfterDataRequested(iRowCount);
			this.getRowContexts(iRowCount, true);  // Trigger data request.
		}
	};

	/**
	 * Gets the row count as configured with the <code>rowCount</code> and <code>minRowCount</code> properties.
	 *
	 * @returns {int} The configured row count.
	 * @private
	 */
	InteractiveRowMode.prototype.getConfiguredRowCount = function() {
		return Math.max(0, this.getMinRowCount(), this.getRowCount());
	};

	/**
	 * @this sap.ui.table.rowmodes.InteractiveRowMode
	 */
	TableDelegate.onBeforeRendering = function(oEvent) {
		var bRenderedRows = oEvent && oEvent.isMarked("renderRows");

		if (this.bLegacy) {
			this.getTable().setVisibleRowCount(this.getComputedRowCounts().count);
		}

		if (!bRenderedRows) {
			this.updateTable(TableUtils.RowsUpdateReason.Render);
		}
	};

	/**
	 * @this sap.ui.table.rowmodes.InteractiveRowMode
	 */
	TableDelegate.onAfterRendering = function(oEvent) {
		var oTable = this.getTable();
		var bRenderedRows = oEvent && oEvent.isMarked("renderRows");

		if (!bRenderedRows && oTable.getRows().length > 0) {
			this.fireRowsUpdated(TableUtils.RowsUpdateReason.Render);
		}
	};

	/**
	 * @this sap.ui.table.rowmodes.InteractiveRowMode
	 */
	TableDelegate.onmousedown = function(oEvent) {
		var oTable = this.getTable();

		if (oEvent.button === 0 && oEvent.target === oTable.getDomRef("sb")) {
			ResizeHelper.initInteractiveResizing(oTable, this, oEvent);
		}
	};

	/**
	 * Initializes the drag&drop for resizing.
	 *
	 * @param {sap.ui.table.Table} oTable Instance of the table.
	 * @param {sap.ui.table.rowmodes.InteractiveRowMode} oMode The interactive row mode.
	 * @param {jQuery.Event} oEvent The event object.
	 */
	ResizeHelper.initInteractiveResizing = function(oTable, oMode, oEvent) {
		var $Body = jQuery(document.body);
		var $Splitter = oTable.$("sb");
		var $Document = jQuery(document);
		var offset = $Splitter.offset();
		var height = $Splitter.height();
		var width = $Splitter.width();
		var bTouch = oTable._isTouchEvent(oEvent);

		// Fix for IE text selection while dragging
		$Body.bind("selectstart", ResizeHelper.onSelectStartWhileInteractiveResizing);

		$Body.append(
			"<div id=\"" + oTable.getId() + "-ghost\" class=\"sapUiTableInteractiveResizerGhost\" style =\" height:" + height + "px; width:"
			+ width + "px; left:" + offset.left + "px; top:" + offset.top + "px\" ></div>");

		// Append overlay over splitter to enable correct functionality of moving the splitter
		$Splitter.append(
			"<div id=\"" + oTable.getId() + "-rzoverlay\" style =\"left: 0px; right: 0px; bottom: 0px; top: 0px; position:absolute\" ></div>");

		$Document.bind((bTouch ? "touchend" : "mouseup") + ".sapUiTableInteractiveResize",
			ResizeHelper.exitInteractiveResizing.bind(oTable, oMode));
		$Document.bind((bTouch ? "touchmove" : "mousemove") + ".sapUiTableInteractiveResize",
			ResizeHelper.onMouseMoveWhileInteractiveResizing.bind(oTable)
		);

		oTable._disableTextSelection();
	};

	/**
	 * Drops the previous dragged horizontal splitter bar and recalculates the amount of rows to be displayed.
	 *
	 * @param {sap.ui.table.rowmodes.InteractiveRowMode} oMode The interactive row mode.
	 * @param {jQuery.Event} oEvent The event object.
	 */
	ResizeHelper.exitInteractiveResizing = function(oMode, oEvent) {
		var $Body = jQuery(document.body);
		var $Document = jQuery(document);
		var $Table = this.$();
		var $Ghost = this.$("ghost");
		var iLocationY = ResizeHelper.getEventPosition(this, oEvent).y;
		var iNewHeight = iLocationY - $Table.find(".sapUiTableCCnt").offset().top - $Ghost.height() - $Table.find(".sapUiTableFtr").height();
		var iUserDefinedRowCount = Math.floor(iNewHeight / oMode.getBaseRowHeightOfTable());
		var iNewRowCount = Math.max(1, iUserDefinedRowCount, oMode.getMinRowCount());

		if (oMode.bLegacy) {
			iNewRowCount = Math.max(iNewRowCount, oMode.getFixedTopRowCount() + oMode.getFixedBottomRowCount() + 1);
			this.setVisibleRowCount(iNewRowCount);
		}

		oMode.setRowCount(iNewRowCount);

		$Ghost.remove();
		this.$("rzoverlay").remove();

		$Body.unbind("selectstart", ResizeHelper.onSelectStartWhileInteractiveResizing);
		$Document.unbind("touchend.sapUiTableInteractiveResize");
		$Document.unbind("touchmove.sapUiTableInteractiveResize");
		$Document.unbind("mouseup.sapUiTableInteractiveResize");
		$Document.unbind("mousemove.sapUiTableInteractiveResize");

		this._enableTextSelection();
	};

	/**
	 * Handler for the selectstart event triggered in IE to select the text. Avoid this during resize drag&drop.
	 *
	 * @param {jQuery.Event} oEvent The event object.
	 * @returns {boolean} Always returns false.
	 */
	ResizeHelper.onSelectStartWhileInteractiveResizing = function(oEvent) {
		oEvent.preventDefault();
		oEvent.stopPropagation();
		return false;
	};

	/**
	 * Handler for the move events while dragging the horizontal resize bar.
	 *
	 * @param {jQuery.Event} oEvent The event object.
	 */
	ResizeHelper.onMouseMoveWhileInteractiveResizing = function(oEvent) {
		var iLocationY = ResizeHelper.getEventPosition(this, oEvent).y;
		var iMin = this.$().offset().top;

		if (iLocationY > iMin) {
			this.$("ghost").css("top", iLocationY + "px");
		}
	};

	// TODO: Copied from TablePointerExtension. Maybe move this to utils.
	/**
	 * Gets the position of an event.
	 *
	 * @param {sap.ui.table.Table} oTable Instance of the table.
	 * @param {jQuery.Event} oEvent The event object.
	 * @returns {{x: int, y: int}} The event position.
	 */
	ResizeHelper.getEventPosition = function(oTable, oEvent) {
		var oPosition;

		function getTouchObject(oTouchEvent) {
			if (!oTable._isTouchEvent(oTouchEvent)) {
				return null;
			}

			var aTouchEventObjectNames = ["touches", "targetTouches", "changedTouches"];

			for (var i = 0; i < aTouchEventObjectNames.length; i++) {
				var sTouchEventObjectName = aTouchEventObjectNames[i];

				if (oEvent[sTouchEventObjectName] && oEvent[sTouchEventObjectName][0]) {
					return oEvent[sTouchEventObjectName][0];
				}
				if (oEvent.originalEvent[sTouchEventObjectName] && oEvent.originalEvent[sTouchEventObjectName][0]) {
					return oEvent.originalEvent[sTouchEventObjectName][0];
				}
			}

			return null;
		}

		oPosition = getTouchObject(oEvent) || oEvent;

		return {x: oPosition.pageX, y: oPosition.pageY};
	};

	return InteractiveRowMode;
});