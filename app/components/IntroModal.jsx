var React = require("react");


/**
 * The new (Summer 2016) intro modal.
 * This is distinct from the intro.js "intro",
 * which acts more like a series of walkthrough overlays.
 */
var coverImgPath = './static/introModalCover.png';
var IntroModal = React.createClass({

	propTypes: {
		onDismiss: React.PropTypes.func
	},

	componentWillMount: function() {

		var img = new Image(),
			onload = function (event) {
				img.removeEventListener('load', onload);
				this.setState({
					coverImgLoaded: true
				});
			}.bind(this);

		img.addEventListener('load', onload);
		img.src = coverImgPath;

	},

	getInitialState: function () {

		return {
			pageIndex: 0,
			coverImgLoaded: false
		};

	},

	setPage: function (pageIndex) {

		pageIndex = Math.max(0, Math.min(pageIndex, 1));
		this.setState({
			pageIndex: pageIndex
		});

	},

	dismissIntro: function () {

		if (this.props.onDismiss) this.props.onDismiss(this.refs.muteIntroInput.getDOMNode().checked);

	},

	handleInputChange: function () {

		this.refs.muteIntroLabel.getDOMNode().classList.toggle('checked', this.refs.muteIntroInput.getDOMNode().checked);

	},



	// ============================================================ //
	// Lifecycle
	// ============================================================ //

	render: function () {

		if (this.state.pageIndex === 0) {

			return (
				<div className='intro-modal'>
					<div className='page p0'>
						<div className='title-block'>
							<h1>The Overland Trails</h1>
							<h3>1840 - 1860</h3>
						</div>
						<img src={ coverImgPath } className={ this.state.coverImgLoaded ? '' : 'loading' } />
						<p>During the 1840s tens of thousands of American migrants made long journeys through the American West seeking land in Oregon, gold in California, and religious liberty in Utah.</p>
						<div className='intro-modal-button' onClick={ function (e) { this.setPage(1); }.bind(this) }>Next</div>
					</div>
				</div>
			);

		} else {

			return (
				<div className='intro-modal'>
					<div className='page p1'>
						<div className='title-block'>
							<h3>HOW TO USE</h3>
							<h2>THIS MAP</h2>
						</div>
						<div className='content'>
							<ol>
								<li>
									<div className='ordinal'>1</div>
									<div className='item'>
										<p>The map traces the routes of about two dozen migrants over the three trails.</p>
										<img src='./static/introModalStep01.png' />
									</div>
								</li>
								<li className='wider'>
									<div className='ordinal'>2</div>
									<div className='item'>
										<p>Read a migrant’s diary and follow their journey on the map.</p>
										<img src='./static/introModalStep02.png' />
									</div>
								</li>
								<li>
									<div className='ordinal descender'>3</div>
									<div className='item'>
										<p>Use the timeline to select a year and see the pace of migration west from Missouri (86°W) to the west coast (123°W).</p>
										<img src='./static/introModalStep03.png' />
									</div>
								</li>
								<li className='wider'>
									<div className='ordinal descender'>4</div>
									<div className='item'>
										<p>Use the flow chart to see how the number of people migrating west changed, sometimes enormously, from year to year.</p>
										<img src='./static/introModalStep04.png' />
									</div>
								</li>
							</ol>
						</div>
						<p className='map-desc'>Lorem dim sum turnip cake leek dumplings deep fried taro turnover. Cha siu sou Cheong fan pan fried bitter melon beef dumpling mango pudding coconut milk pudding.</p>
						<div className='intro-modal-button' onClick={ this.dismissIntro }>Enter</div>
						<div className='footer'>
							<div onClick={ function (e) { this.setPage(0); }.bind(this) }>&lt; back</div>
							<label onChange={ this.handleInputChange } ref='muteIntroLabel'><input type='checkbox' ref='muteIntroInput' />do not show again</label>
						</div>
					</div>
				</div>
			);

		}

	}

});

module.exports = IntroModal;