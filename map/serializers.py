from rest_framework import serializers

from map.models import CommunityArea, RestaurantPermit


"""
TODO: Re-work this to return in a more parseable format 

e.g. The endpoint /map-data/?year=2017 should return something like:
    [
        {
            "ROGERS PARK": {
                area_id: 17,
                num_permits: 2
            },
            "BEVERLY": {
                area_id: 72,
                num_permits: 2
            },
            ...
        }
    ]
 """
class CommunityAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityArea
        fields = ["name", "area_id", "num_permits"]

    num_permits = serializers.SerializerMethodField()

    def get_num_permits(self, obj):

        return len(
            RestaurantPermit.objects.filter(
                issue_date__year=self.context["year"], 
                community_area_id=str(obj.area_id)
                )
            )
        
