/*
 Class to quickly layout a chart for D3 projects.

 D3 needs to be included before including this class

 License: MIT
 */

class D3ChartLayout {
  /*
   Defaults to a width of 960px with an aspect ratio of 16:9
   Use width and/or aspectRatio to dynamically set height
   Use height and width to explicitly set the size of the chart
   Margins default to 10%, either pass an margins object or call setMargins to adjust with a percentage
   Call setLabels to change the labels from default or pass a full labels object
   */

  constructor(props = {}) {
    const aspectRatio = (props.hasOwnProperty('aspectRatio'))
      ? props.aspectRatio
      : 16 / 9;
    const width = (props.hasOwnProperty('width'))
      ? props.width
      : 960;
    const height = (props.hasOwnProperty('height'))
      ? props.height
      : width / aspectRatio;
    const margins = (props.hasOwnProperty('margins'))
      ? props.margins
      : {
        top: height * 0.1,
        right: width * 0.1,
        bottom: height * 0.1,
        left: width * 0.1,
      };
    const labels = (props.hasOwnProperty('labels'))
      ? props.labels
      : {
        className: 'labels',
        header: { id: 'header', text: 'Header' },
        footer: { id: 'footer', text: 'Footer' },
        left: { id: 'left-label', text: 'Left Label' },
        right: { id: 'right-label', text: 'Right Label' },
      };

    // Don't require the className for label objects to be passed
    if (!labels.hasOwnProperty('className')) {
      labels.className = 'labels';
    }
    this.height = height;
    this.width = width;
    this.margins = margins;
    this.labels = labels;
    this.svgGroups = {};
  }

  /* Calculate our areas for rendering elements

    Returns an area object of the form
    {
      height: value in px,
      width: value in px,
      X: starting x pixel,
      Y: starting y pixel
    }

  */
  get plotArea() {
    return D3ChartLayout.calculateArea(this.height, this.width, 0, 0, this.margins);
  }

  get headerArea() {
    return D3ChartLayout.calculateArea(this.margins.top, this.plotArea.width,
      this.margins.left, 0);
  }

  get footerArea() {
    return D3ChartLayout.calculateArea(this.margins.bottom, this.plotArea.width,
      this.margins.left, this.height - this.margins.bottom);
  }

  get leftLabelArea() {
    return D3ChartLayout.calculateArea(this.plotArea.height, this.margins.left, 0,
      this.margins.top);
  }

  get rightLabelArea() {
    return D3ChartLayout.calculateArea(this.plotArea.height, this.margins.right,
      this.width - this.margins.right, this.margins.top);
  }

  get topRightArea() {
    return D3ChartLayout.calculateArea(this.margins.top, this.margins.right,
      this.width - this.margins.right, 0);
  }

  get topLeftArea() {
    return D3ChartLayout.calculateArea(this.margins.top, this.margins.left, 0, 0);
  }

  get bottomRightArea() {
    return D3ChartLayout.calculateArea(this.margins.bottom, this.margins.right,
      this.width - this.margins.right, this.height - this.margins.bottom);
  }

  get bottomLeftArea() {
    return D3ChartLayout.calculateArea(this.margins.bottom, this.margins.left, 0,
      this.height - this.margins.bottom);
  }

  static calculateMargins(percentage, height, width) {
    const percentValue = (percentage < 1)
      ? percentage
      : percentage / 100;

    // if percent is 0, just return 0
    let marginX = !!percentValue ? width * percentValue : 0;
    let marginY = !!percentValue ? height * percentValue : 0;

    return {
      top: marginY,
      right: marginX,
      bottom: marginY,
      left: marginX,
    };
  }

  static calculateArea(height, width, startX, startY, margins) {
    // For margins, pass a percentage value or a margins object
    // default is 0% of the area for no margins
    const areaMargins = (margins === undefined)
      ? D3ChartLayout.calculateMargins(0, height, width)
      : (typeof margins === 'number')
        ? D3ChartLayout.calculateMargins(margins, height, width)
        : margins;

    const area = {};
    area.height = height - (areaMargins.top + areaMargins.bottom);
    area.width = width - (areaMargins.right + areaMargins.left);
    area.X = startX + areaMargins.left;
    area.Y = startY + areaMargins.top;
    return area;
  }

  setMargins(percentage) {
    this.margins = D3ChartLayout.calculateMargins(percentage, this.height, this.width);
  }

  setLabels(labels = {}) {
    const myLabels = Object.keys(this.labels);
    Object.keys(labels).forEach(k1 => {
      if (myLabels.includes(k1)) {
        const myKeys = Object.keys(this.labels[k1]);
        Object.keys(labels[k1]).forEach(k2 => {
          if (myKeys.includes(k2)) {
            this.labels[k1][k2] = labels[k1][k2];
          }
        });
      }
    });
    this.createLabels(this.labels)
  }

  appendSVGGroup(name, area) {
    this.svgGroups[name] = this.svg
      .append('g')
      .attr('id', name)
      .attr('transform', `translate(${area.X}, ${area.Y})`);
  }

  createSVG(divID, className) {
    // Render the main SVG element, use viewBox for the most responsive behavior
    this.svg = d3.select(divID)
      .append('svg')
      .attr('class', className)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
  }

  createAreaGroups() {
    this.appendSVGGroup('plotGroup', this.plotArea);
    this.appendSVGGroup('headerGroup', this.headerArea);
    this.appendSVGGroup('footerGroup', this.footerArea);
    this.appendSVGGroup('leftGroup', this.leftLabelArea);
    this.appendSVGGroup('rightGroup', this.rightLabelArea);
    this.appendSVGGroup('topLeftGroup', this.topLeftArea);
    this.appendSVGGroup('topRightGroup', this.topRightArea);
    this.appendSVGGroup('bottomLeftGroup', this.bottomLeftArea);
    this.appendSVGGroup('bottomRightGroup', this.bottomRightArea);
  }

  createLabelElement(group, placement, label, textRotation) {
    const { X, Y, fontSize } = placement;
    const { text, id } = label;
    if (text === '') {
      return;
    }

    // Remove an already existing label
    group.select('text').remove();
    group.append('text')
      .attr('id', id)
      .attr('class', this.labels.className)
      .attr('font-size', fontSize)
      .attr('x', X)
      .attr('y', Y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(text);
    if (!!textRotation) {
      group.select('text')
        .attr('transform', `rotate(${textRotation}, ${X}, ${Y})`);
    }
  }

  createLabels(labels) {
    //TODO: Figure out how to override or compute easier
    const headerPlacement = {
      X: this.headerArea.width / 2,
      Y: this.headerArea.height / 4,
      fontSize: this.headerArea.height / 2,
    };
    const subHeaderPlacement = {
      X: this.headerArea.width / 2,
      Y: this.headerArea.height * 3 / 4,
      fontSize: this.headerArea.height / 4,
    };
    const rightLabelPlacement = {
      X: this.rightLabelArea.width / 2,
      Y: this.rightLabelArea.height / 2,
      fontSize: this.rightLabelArea.width / 4,
    };
    const leftLabelPlacement = {
      X: this.leftLabelArea.width / 2,
      Y: this.leftLabelArea.height / 2,
      fontSize: this.leftLabelArea.width / 4,
    };
    const footerPlacement = {
      X: this.footerArea.width / 2,
      Y: this.footerArea.height * 3 / 4,
      fontSize: this.footerArea.height / 4,
    };

    this.createLabelElement(this.svgGroups.headerGroup, headerPlacement, labels.header, 0);
    this.createLabelElement(this.svgGroups.footerGroup, footerPlacement, labels.footer, 0);
    this.createLabelElement(this.svgGroups.leftGroup, leftLabelPlacement, labels.left, -90);
    this.createLabelElement(this.svgGroups.rightGroup, rightLabelPlacement, labels.right, 90);
    if (labels.hasOwnProperty('subheader')) {
      this.createLabelElement(this.svgGroups.headerGroup, subHeaderPlacement, labels.subheader, 0);
    }
  }

  createChartLayout(props = {}) {
    const divID = (props.hasOwnProperty('divID')) ? props.divID : '#root';
    const svgClass = (props.hasOwnProperty('svgClass'))
      ? props.svgClass
      : 'D3ChartLayout';
    this.createSVG(divID, svgClass);
    this.createAreaGroups();
    this.createLabels(this.labels);
  }
}
