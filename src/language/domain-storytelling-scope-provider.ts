/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { ReferenceInfo, Scope } from 'langium';
import { DefaultScopeProvider, EMPTY_SCOPE } from 'langium';
import { Agent, AgentDeclaration, isActivityClause, isAgent, isAgentDeclaration, isResource, isResourceDeclaration, isStory, isStoryBook, isWorkObjectDeclaration, Resource, ResourceDeclaration, WorkObjectDeclaration } from './generated/ast.js';

/**
 * Special scope provider that matches symbol names regardless of lowercase or uppercase.
 */
export class DomainStorytellingScopeProvider extends DefaultScopeProvider {

    override getScope(context: ReferenceInfo): Scope {
        const container = context.container;

        if (context.property === 'icon' && isResourceDeclaration(container)) {
            return this.getIconScope(context, container);
        }

        if (context.property === 'resource' && isAgent(container)) {
            return this. getAgentScope(container);
        }
        
        if (context.property === 'resource' && isResource(container)) {
            return this. getResourceScope(container);
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
    protected getAgentScope(agent: Agent) : Scope {
        const story = agent.$container.$container;
        const book = story.book?.ref;
        const outerScope = (book != null) ? this.createScopeForNodes(book.declarations.filter((d): d is AgentDeclaration => isAgentDeclaration(d))) : EMPTY_SCOPE;
        return this.createScopeForNodes(story.declarations.filter((a): a is AgentDeclaration => isAgentDeclaration(a)), outerScope);
    }


    /**
     * Returns all resource declarations (Agents AND WorkObjects) from the containing Story AND from its referenced StoryBook.
     */
    protected getResourceScope(resource: Resource) : Scope {
        //
        // PROBLEM: THE SCOPE RETURNED BY THIS METHOD IS SOMEHOW AUGMENTED BY THE GLOBAL SCOPE AND THUS HAS NOT EFFECT.
        const activityClause = resource.$container;
        if( ! isActivityClause(activityClause)) return EMPTY_SCOPE;
        const activity = activityClause.$container;
        const story = activity.$container;
        const book = story.book?.ref;

        if(activityClause === activity.clauses[0])  { // the first clause must be a WorkObject --> limit scope
            const outerScope = (book != null) ? this.createScopeForNodes(book.declarations.filter((d): d is WorkObjectDeclaration => isWorkObjectDeclaration(d))) : EMPTY_SCOPE;
            return this.createScopeForNodes(story.declarations.filter((d): d is WorkObjectDeclaration => isWorkObjectDeclaration(d)), outerScope);

        } else {
            const outerScope = (book != null) ? this.createScopeForNodes(book.declarations) : EMPTY_SCOPE;
            return this.createScopeForNodes(story.declarations, outerScope);
        }
    }
}
