/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { ReferenceInfo, Scope } from 'langium';
import { DefaultScopeProvider, EMPTY_SCOPE } from 'langium';
import { AgentDeclaration, isAgentDeclaration, isResourceDeclaration, isSentence, isStory, isStoryBook, isWorkObject, ResourceDeclaration, Sentence, WorkObject } from './generated/ast.js';
import { LangiumServices } from 'langium/lsp';

/**
 * Special scope provider that matches symbol names regardless of lowercase or uppercase.
 */
export class DomainStorytellingScopeProvider extends DefaultScopeProvider {

    constructor(services:LangiumServices) {
        super(services);
    }

    // protected override createScope(elements: Iterable<AstNodeDescription>, outerScope: Scope, options?: ScopeOptions): Scope {
    //     return new StreamScope(stream(elements), outerScope, { ...options, caseInsensitive: true });
    // }

    // protected override getGlobalScope(referenceType: string): Scope {
    //     return this.globalScopeCache.get(referenceType, () => new MapScope(this.indexManager.allElements(referenceType), undefined, { caseInsensitive: true }));
    // }

    override getScope(context: ReferenceInfo): Scope {
        const container = context.container;

        if (context.property === 'icon' && isResourceDeclaration(container)) {
            return this.getIconScope(context, container);
        }

        if (context.property === 'initiator' && isSentence(container)) {
            return this. getInitiatingAgentScope(container);
        }
        
        if (context.property === 'resource' && isWorkObject(container)) {
            return this. getWorkObjectScope(container);
        }

        return super.getScope(context);
    }

    protected getIconScope(context: ReferenceInfo, resource: ResourceDeclaration): Scope {
        const book = isStory(resource.$container) ? resource.$container.book.ref : (isStoryBook(resource.$container) ? resource.$container : null);
        if (book != null) {
            const iconLibrary = book.library.ref;
            if (iconLibrary != null) {
                return this.createScopeForNodes(iconLibrary.icons);
            }
        }
        return super.getScope(context);
    }


    /**
     * Returns all Agent declarations from the containing Story AND from its referenced StoryBook.
     */
    protected getInitiatingAgentScope(sentence: Sentence) : Scope {
        const story = sentence.$container;
        const book = story.book?.ref;
        const outerScope = (book != null) ? this.createScopeForNodes(book.declarations.filter((a): a is AgentDeclaration => isAgentDeclaration(a))) : EMPTY_SCOPE;
        return this.createScopeForNodes(story.declarations.filter((a): a is AgentDeclaration => isAgentDeclaration(a)), outerScope);
    }


    /**
     * Returns all resource declarations (Agents AND WorkObjects) from the containing Story AND from its referenced StoryBook.
     */
    protected getWorkObjectScope(sentence: WorkObject) : Scope {
        const story = sentence.$container.$container;
        const book = story.book?.ref;
        const outerScope = (book != null) ? this.createScopeForNodes(book.declarations) : EMPTY_SCOPE;
        return this.createScopeForNodes(story.declarations, outerScope);
    }

}
