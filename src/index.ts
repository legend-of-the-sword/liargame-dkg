import { v4 as uuidv4 } from "uuid";
import { Server, StableBTreeMap, ic } from "azle";
import express from "express";
import * as secp from "@noble/secp256k1";

/**
 * `messagesStorage` - it's a key-value datastructure that is used to store messages.
 * {@link StableBTreeMap} is a self-balancing tree that acts as a durable data storage that keeps data across canister upgrades.
 * For the sake of this contract we've chosen {@link StableBTreeMap} as a storage for the next reasons:
 * - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 * - data stored in the map survives canister upgrades unlike using HashMap where data is stored in the heap and it's lost after the canister is upgraded
 *
 * Brakedown of the `StableBTreeMap(string, Message)` datastructure:
 * - the key of map is a `messageId`
 * - the value in this map is a message itself `Message` that is related to a given key (`messageId`)
 *
 * Constructor values:
 * 1) 0 - memory id where to initialize a map.
 */

/**
    This type represents a message that can be listed on a board.
*/

class PrivateKey {
  createdAt: Date;
  id: string;
  gameId: string;
  sk: Uint8Array[];
  pk: Uint8Array[];
}
interface Guess {
  createdAt: Date;
  id: string;
  gameId: string;
  user: string;
  guess: string;
}
interface LiarGame {
  createdAt: Date;
  id: string;
  isDemo: boolean | null | undefined;
  gameId: string;
  key: PrivateKey;
  guesses: Guess[];
  won: boolean;
}
interface Db {
  games: LiarGame[];
}

const allGames = StableBTreeMap<string, Db>(0);
const guessStorage = StableBTreeMap<string, Guess>(0);
const keyStorage = StableBTreeMap<string, PrivateKey>(0);
const gameStorage = StableBTreeMap<string, LiarGame>(0);

export default Server(() => {
  const app = express();
  app.use(express.json());

  app.post("/guess", (req, res) => {
    const guess: Guess = {
      id: uuidv4(),
      createdAt: getCurrentDate(),
      ...req.body,
    };
    guessStorage.insert(guess.id, guess);
    res.json(guess);
  });

  app.post("/game", (req, res) => {
    const privKey = secp.utils.randomPrivateKey(); // Secure random private key
    const pubKey = secp.getPublicKey(privKey);

    const key: PrivateKey = {
      id: uuidv4(),
      sk: privKey,
      pk: pubKey,
      createdAt: getCurrentDate(),
      ...req.body,
    };
    const game: LiarGame = {
      id: uuidv4(),
      key: key,
      createdAt: getCurrentDate(),
      ...req.body,
    };
    gameStorage.insert(game.id, game);
    res.json(game);
  });

  app.get("/games", (req, res) => {
    res.json(gameStorage.values());
  });

  return app.listen();
});

function getCurrentDate() {
  const timestamp = new Number(ic.time());
  return new Date(timestamp.valueOf() / 1000_000);
}
