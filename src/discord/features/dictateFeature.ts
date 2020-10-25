import { inject, injectable } from "inversify";
import { ListenerFactoryTag } from "../tags";
import Feature, { Registration } from "./feature";
import { ListenerFactory } from "./listener";

@injectable()
export default class DictateFeature extends Feature {

  constructor(
    @inject(ListenerFactoryTag) private listenerFactory: ListenerFactory
    ) {
    super();
  }

  public *setup(): Iterable<Registration> {
    const listener = this.listenerFactory.createListener('Games');
    if (!listener) {
      return;
    }

    yield this.respond(/dictate( me)?/i, async (resp, _) => 
      resp.operation(
        () => listener.listen(),
        (message) => message,
        (err) => `Failed to start listener - ${err}`
      )
    )
  }
}