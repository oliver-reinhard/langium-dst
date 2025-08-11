import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { createDomainStorytellingServices } from './domain-storytelling-module.js';
import { addDiagramHandler } from 'langium-sprotty';

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared } = createDomainStorytellingServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);

addDiagramHandler(connection, shared);