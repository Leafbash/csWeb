describe('csComp.Services.LeafletRenderer', function() {

    // load the module
    beforeEach(angular.mock.module('csComp'));

    var f: csComp.Services.IFeature,
        r: csComp.Services.ITypesResource,
        e: L.LeafletMouseEvent,
        group: csComp.Services.ProjectGroup,
        renderer: csComp.Services.LeafletRenderer;

    describe('A Leaflet tooltip', () => {
        beforeEach(() => {
            renderer = new csComp.Services.LeafletRenderer();

            f = <csComp.Services.IFeature>{};
            f.properties = {
                'Name': 'Test',
                'amount_men': 1000000,
                'percentage_children': 0.125
            };
            f.fType = {
                _propertyTypeData: [{
                    'label': 'amount_men',
                    'title': 'Number of men',
                    'type': 'number',
                    'stringFormat': '{0:0,0}'
                }, {
                    'label': 'percentage_children',
                    'title': 'Percentage of children',
                    'type': 'number',
                    'stringFormat': '{0:0.00%}'
                }]
            };

            e = <L.LeafletMouseEvent>{};
            e.target = {
                'feature': f
            };

            group = new csComp.Services.ProjectGroup();
        });

        it ('should only have a title when no filter or style is selected', () => {
            var tooltip = renderer.generateTooltipContent(e, group);
            expect(tooltip).toBeDefined();
            expect(tooltip.content).toContain(f.properties['Name']);
        });

        it('should have an entry for each filter.', () => {
            var filter = new csComp.Services.GroupFilter();
            filter.property = 'amount_men';
            filter.title = 'Number of men';
            group.filters = [filter];
            var tooltip = renderer.generateTooltipContent(e, group);
            expect(tooltip).toBeDefined();
            expect(tooltip.content).toContain('Number of men');
            expect(tooltip.content.replace('.', ',')).toContain('1,000,000'); // change thousand separator in Dutch
        });

        it('should have an entry for each style.', () => {
            var style = <csComp.Services.GroupStyle>{};
            style.property = 'percentage_children';
            style.title = 'Percentage of children';
            group.styles = [style];
            group.filters = [];
            var tooltip = renderer.generateTooltipContent(e, group);
            expect(tooltip).toBeDefined();
            expect(tooltip.content).toContain('Percentage of children');
            expect(tooltip.content.replace(',', '.')).toContain('12.50%'); // change decimal point in Dutch
        });

    });

});