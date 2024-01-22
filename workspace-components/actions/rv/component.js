import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { alias } from '@ember/object/computed';

const WORKSPACE_NAME = 'My Workspace';
const COMPONENT_BASE_NAME = 'search';
const SMART_ACTION_NAME = 'Lalalab-test';
export default class extends Component {
  @service errorHandler;
  @service router;
  @service store;
  @service customAction;

  @tracked targetComponent;
  @tracked forceMove;
  @tracked forceCarrier;
  @tracked reasonForRV;
  @tracked reasons;
  @alias('targetComponent._selectedRecords.0') selectedProduct;

  constructor(...args) {
    super(...args);

    const workspace = this.store.peekAll('workspace').find(workspace => workspace.name.includes(WORKSPACE_NAME));
    this.targetComponent = workspace.components.find(component => component.name.includes(COMPONENT_BASE_NAME));
  }

  @action
  triggerAction() {
    const smartAction = this.store.peekAll('custom-action').find(c => c.name === SMART_ACTION_NAME)
    const values = {
      reason: this.reasonForRV,
      items: this.selectedProduct['forest-extraInfo'].items,
      forceMove: this.forceMove,
      forceCarrier: this.forceCarrier
    }

    return this.customAction.triggerCustomAction(smartAction, [this.selectedProduct], values)
  }
}