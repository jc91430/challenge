from network import Network

class Person(object):
    PENDING = 0
    ACCEPTED = 1
    DECLINED = 2

    def __init__(self, data, status, about, fundraise):
        self.first = data['given_name']
        self.last = data['family_name']
        self.email = data['email']
        self.status = self.PENDING
        self.about = about
        self.fundraise = fundraise
        #self.ID = -1                 # -1 is the uninitialized value
        #self.idnum = data['sub']
        #projects
        #videos/images

    # Sets the user's ID
    # def set_ID(self, num):
    #     self.ID = num

    # Prints out a string representation of the current Person object
    def to_string(self):
        return "Name: " + self.first + " " + self.last + "\nEmail: " + self.email + \
        "\nStatus: " + self.status + "\nAbout: " + self.about + "\nFundraising link: " + self.fundraise + "\n" #+ "\nID: " + self.idnum

def test():
    sampleDataA = {"given_name":"Alice", "family_name":"Appleton", "email":"alice@gmail.com"}
    sampleDataB = {"given_name":"Bob", "family_name":"Smith", "email":"bob@gmail.com"}
    alice = Person(sampleDataA, "ACCEPTED", "My name is Alice", "n/a")
    alice_two = Person(sampleDataA, "ACCEPTED", "My name is Alice", "n/a")
    bob = Person(sampleDataB, "PENDING", "My name is Bob", "n/a")
    
    graph = Network()
    # graph.add_person(alice, bob)
    # graph.add_person(alice, alice_two)
    graph.print_all()

if __name__ == '__main__':
    test()