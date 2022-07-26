<?php
namespace wcf\page;
use wcf\system\WCF;

/**
 * A simple test page for demonstration purposes.
 *
 * @author	YOUR NAME
 * @license	GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 */
class TestPage extends AbstractPage {
	/**
	 * @var string
	 */
	protected $greet = '';

	/**
	 * @inheritDoc
	 */
	public function readParameters() {
		parent::readParameters();

		if (isset($_GET['greet'])) $this->greet = $_GET['greet'];
	}

	/**
	 * @inheritDoc
	 */
	public function readData() {
		parent::readData();

		if (empty($this->greet)) {
			$this->greet = 'World';
		}
	}

	/**
	 * @inheritDoc
	 */
	public function assignVariables() {
		parent::assignVariables();

		WCF::getTPL()->assign([
			'greet' => $this->greet
		]);
	}
}
